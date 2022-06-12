import joi from "joi";
import { ValidationException } from "../exceptions";

const emailBodySchema = joi.object({
  email: joi.string().email(),
});
export function validateEmailBody(data: any) {
  return joi.attempt(
    data,
    emailBodySchema,
    new ValidationException("Validation exception on email")
  );
}

const verifyAuthenticatorParams = joi.object({
  accountId: joi.string().min(1).required(),
  token: joi.string().min(1).required(),
});
export function validateVerifyAuthenticatorParams(data: any) {
  return joi.attempt(
    data,
    verifyAuthenticatorParams,
    new ValidationException(
      "Some params were missing when trying to verify authenticator"
    )
  );
}
