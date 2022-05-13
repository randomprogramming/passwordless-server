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

// Should only be used when validation of some input data fails
export class ValidationException extends BaseError {}

export class NullData extends BaseError {}
