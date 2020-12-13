import Joi from "joi";
import HttpError from 'http-errors';

export function validateInput<T>(validator: Joi.ObjectSchema<T>, body: unknown): T {
  const result = validator.validate(body);
  if (result.error) {
    console.warn('error:', result.error);
    // TODO: provide additional context on why the error occured
    throw new HttpError.BadRequest('Bad Request');
  }
  return body as T;
}