import React, {
  createContext,
  FunctionComponent,
  useContext,
  useMemo,
  useState,
} from 'react';

import { customShowError } from 'utils/other';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// mock mode (local UI testing without Cognito)
import { MOCK_ENABLED } from 'mocks/mock.config';
import {
  MOCK_AUTH_SESSION,
  MOCK_AUTH_USER,
  MOCK_JWT,
  MOCK_SIGN_IN_OUTPUT,
  mockSignedIn,
  setMockSignedIn,
} from 'mocks/mock.auth';

// Backend V2 (Supabase Auth replaces Cognito)
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  sbConfirmPasswordReset,
  sbCurrentSession,
  sbDeactivateAndSignOut,
  sbForgotPassword,
  sbSignIn,
  sbSignOut,
  sbUpdateEmail,
  sbUpdatePassword,
} from 'services/supabase/supabase.auth';

// aws-amplify removed — the legacy Cognito branches were dead code (BACKEND is
// only ever 'mock' | 'supabase'). Structural aliases keep the exported API
// surface identical for consumers.
type AuthUser = any;
type JWT = { payload?: any; toString: () => string } | any;
type AuthSession = any;
type SignInOutput = any;
type UpdateUserAttributesInput = any;
type UpdateUserAttributesOutput = any;
type ConfirmUserAttributeInput = any;
type SendUserAttributeVerificationCodeInput = any;

type UserAWSContext = {
  userAWS: AuthUser | null;
  jwtTokenUser: JWT | null;
  checkCurrentUserAWS: () => Promise<{
    authSession: AuthSession;
    currentUser: AuthUser;
  } | null>;
  authAWS: (
    email: string,
    password: string,
  ) => Promise<SignInOutput | null>;
  forgotPassword: (params: Authentication.ForgotPasswordParams) => Promise<any>;
  updatePassword: (
    params: Authentication.ForgotPasswordSubmitParams,
  ) => Promise<any>;
  updateUserAttributesAWS: (
    data: UpdateUserAttributesInput,
  ) => Promise<UpdateUserAttributesOutput | null>;
  handleConfirmUserAttribute: (
    data: ConfirmUserAttributeInput,
  ) => Promise<boolean>;
  handleSendUserAttributeVerificationCode: (
    data: SendUserAttributeVerificationCodeInput,
  ) => Promise<boolean>;
  updatePasswordAWS: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<boolean | string>;
  signOutAWS: () => Promise<boolean>;
  deleteAWS: () => Promise<boolean>;
};

type UserAWSProviderProps = {
  children: React.ReactNode;
};

export const userAWSContext = createContext({} as UserAWSContext);

const UserAWSProvider: FunctionComponent<UserAWSProviderProps> = ({
  children,
}) => {
  const { showToast } = useToastProvider();
  const [userAWS, setUserAWS] = useState<AuthUser | null>(null);
  const [jwtTokenUser, setJwtTokenUser] = useState<JWT | null>(null);

  const checkCurrentUserAWS = async () => {
    if (MOCK_ENABLED) {
      if (!mockSignedIn) return null;
      setJwtTokenUser(MOCK_JWT);
      setUserAWS(MOCK_AUTH_USER);
      return { authSession: MOCK_AUTH_SESSION, currentUser: MOCK_AUTH_USER };
    }
    if (SUPABASE_ENABLED) {
      try {
        const session = await sbCurrentSession();
        if (!session) return null;
        setJwtTokenUser(session.jwt);
        setUserAWS(session.user as any);
        return {
          authSession: session.authSession,
          currentUser: session.user as any,
        };
      } catch (error) {
        if (__DEV__) console.log('supabase session error:', error);
        return null;
      }
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return null;
  };

  const authAWS = async (email: string, password: string, getUserDB = true) => {
    if (MOCK_ENABLED) {
      // Any credentials sign in as the mock user.
      setMockSignedIn(true);
      setJwtTokenUser(MOCK_JWT);
      setUserAWS(MOCK_AUTH_USER);
      return MOCK_SIGN_IN_OUTPUT;
    }
    if (SUPABASE_ENABLED) {
      try {
        const result = await sbSignIn(email, password);
        setJwtTokenUser(result.jwt);
        setUserAWS(result.user as any);
        return result.signInOutput;
      } catch (error) {
        customShowError({ error, showToast });
        return null;
      }
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return null;
  };

  const forgotPassword = async ({
    email,
  }: Authentication.ForgotPasswordParams) => {
    if (MOCK_ENABLED) return { isPasswordReset: true } as any;
    if (SUPABASE_ENABLED) return sbForgotPassword(email);
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return null;
  };

  const updatePassword = async ({
    email,
    verificationCode,
    newPassword,
  }: Authentication.ForgotPasswordSubmitParams) => {
    if (MOCK_ENABLED) return true as any;
    if (SUPABASE_ENABLED)
      return sbConfirmPasswordReset(email, verificationCode, newPassword);
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return null;
  };

  const updateUserAttributesAWS = async (
    data: UpdateUserAttributesInput,
  ) => {
    if (MOCK_ENABLED) return {} as any;
    if (SUPABASE_ENABLED) {
      const newEmail = (data as any)?.userAttributes?.email;
      if (newEmail) await sbUpdateEmail(newEmail);
      return {} as any;
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return null;
  };

  const handleConfirmUserAttribute = async (
    data: ConfirmUserAttributeInput,
  ) => {
    if (MOCK_ENABLED || SUPABASE_ENABLED) return true;
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return false;
  };

  const handleSendUserAttributeVerificationCode = async (
    data: SendUserAttributeVerificationCodeInput,
  ) => {
    if (MOCK_ENABLED || SUPABASE_ENABLED) return true;
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return false;
  };

  const updatePasswordAWS = async (
    oldPassword: string,
    newPassword: string,
  ) => {
    if (MOCK_ENABLED) return true;
    if (SUPABASE_ENABLED) {
      try {
        return await sbUpdatePassword(newPassword);
      } catch (error: any) {
        customShowError({ error, showToast });
        return error.name;
      }
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return false;
  };

  const signOutAWS = async () => {
    if (MOCK_ENABLED) {
      setMockSignedIn(false);
      setUserAWS(null);
      setJwtTokenUser(null);
      return true;
    }
    if (SUPABASE_ENABLED) {
      try {
        await sbSignOut();
      } catch (error) {
        if (__DEV__) console.log('supabase signOut error:', error);
      }
      setUserAWS(null);
      setJwtTokenUser(null);
      return true;
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return false;
  };

  const deleteAWS = async () => {
    if (MOCK_ENABLED) {
      setMockSignedIn(false);
      setUserAWS(null);
      setJwtTokenUser(null);
      return true;
    }
    if (SUPABASE_ENABLED) {
      // REAL deletion: sbDeactivateAndSignOut invokes the delete-account
      // edge function (service role, JWT-verified identity) and falls back
      // to deactivate+signout only if the function is unreachable.
      // MUST run while the session is alive — callers may not sign out first.
      const deleted = await sbDeactivateAndSignOut();
      if (!deleted) {
        // Don't lie to the user: the account was only deactivated.
        showToast({
          type: 'error',
          title: 'Account deactivated',
          message:
            'We could not fully delete your account right now. Please contact support to complete deletion.',
        });
      }
      setUserAWS(null);
      setJwtTokenUser(null);
      return deleted;
    }
    // Legacy Cognito branch removed (unreachable — BACKEND is mock | supabase).
    return false;
  };

  const value = useMemo(
    () => ({
      userAWS,
      jwtTokenUser,
      checkCurrentUserAWS,
      authAWS,
      updateUserAttributesAWS,
      handleConfirmUserAttribute,
      handleSendUserAttributeVerificationCode,
      updatePasswordAWS,
      signOutAWS,
      deleteAWS,
      forgotPassword,
      updatePassword,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userAWS, jwtTokenUser, showToast],
  );

  return (
    <userAWSContext.Provider value={value}>
      {children}
    </userAWSContext.Provider>
  );
};
export const useUserAWSProvider = () => useContext(userAWSContext);

export default UserAWSProvider;
