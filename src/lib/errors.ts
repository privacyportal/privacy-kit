import config, { ErrorLogger, isErrorLogger } from './config';

export const DEFAULT_ERROR_ACTION = 'Please try again later.';

export class CustomError extends Error {
  constructor({ message }: { message: any }) {
    super(message);
  }
}

export function displayError(err: any) {
  if (err instanceof CustomError) {
    switch (config.onError) {
      case 'ignore': {
        break;
      }
      case 'alert': {
        alert(err.message);
        break;
      }
      default: {
        if (isErrorLogger(config.onError)) {
          (config.onError as ErrorLogger).error(err.message);
        }
      }
    }
  }
}
