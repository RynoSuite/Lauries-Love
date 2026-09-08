import { AxiosError } from 'axios';
import { ToastType } from 'providers/ToastProvider/ToastProvider.types';

/**
 * @description Custom console log
 * @param {string} message
 * @returns {void}
 * @example consoleCustom('Hello World')
 */
export const consoleCustom = (message: string): void => {
  // Debug logger — console calls are expensive on-device in release builds.
  if (!__DEV__) return;
  console.log(
    `%c${JSON.stringify(message)}`,
    'color: white; background-color: red; font-weight: bold;',
  );
};

/**
 * @description Custom show error
 * @param {object} dataError
 * @param {any} dataError.error
 * @param {function} dataError.showToast
 * @returns {void}
 * @example customShowError({ error: new Error('Error message'), showToast: (message) => console.log(message) })
 * @example customShowError({ error: new Error('Error message') })
 */
export const customShowError = (dataError: {
  error: any;
  showToast?: (message: Omit<ToastType, 'id'>) => void;
}): void => {
  const { error, showToast } = dataError;
  if (error instanceof AxiosError && showToast) {
    const code = error.response?.status;

    if (code === 404) {
      return;
    }

    const message = code === 401 ? 'Unauthorized' : error.message;
    showToast({
      title: 'Error',
      message,
      type: 'error',
    });
  } else if (showToast) {
    // Deliberately not gated on `instanceof Error`. Supabase throws AuthError,
    // a subclass of Error, and subclassed builtins routinely fail instanceof
    // once transpiled — so a failed login threw, matched neither branch, and
    // showed nothing at all. The button appeared dead.
    //
    // Anything that reaches here is a failure the member is waiting on, so say
    // something rather than nothing.
    const message =
      (error && (error.message || error.error_description || error.msg)) ||
      'Something went wrong. Please try again.';
    showToast({
      title: 'Error',
      message: String(message),
      type: 'error',
    });
  }
};
