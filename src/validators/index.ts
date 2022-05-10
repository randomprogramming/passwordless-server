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
