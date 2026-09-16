import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import { cliSchema } from "./schema.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateFn = ajv.compile(cliSchema);

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

export function validate(payload: unknown): ValidationResult {
  const valid = validateFn(payload);
  return { valid: Boolean(valid), errors: validateFn.errors ? [...validateFn.errors] : [] };
}
