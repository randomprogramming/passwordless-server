export abstract class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EnvVariableException extends BaseError {
  constructor(envVariableName: string, error: string) {
    super(`Error with env variable: '${envVariableName}': ${error}`);
  }
}
