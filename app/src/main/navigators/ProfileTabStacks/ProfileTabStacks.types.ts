import { PATHS_PROFILE_TAB } from '../paths';

export type RootProfileTabParamList = {
  [PATHS_PROFILE_TAB.profileTabMain]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabDetails]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabUpdateEmail]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabUpdatePhone]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabUpdatePassword]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabUpdateFullName]?: Record<
    string,
    string | number | boolean
  >;
  [PATHS_PROFILE_TAB.profileTabQR]?: Record<string, string | number | boolean>;
};
