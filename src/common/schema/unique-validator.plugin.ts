import { Schema } from 'mongoose';
import uniqueValidator = require('mongoose-unique-validator');

type UniqueValidatorPlugin = (
  schema: Schema,
  options?: Record<string, unknown>,
) => void;

const uniqueValidatorModule = uniqueValidator as unknown as
  | UniqueValidatorPlugin
  | { default?: UniqueValidatorPlugin };

const mongooseUniqueValidator =
  typeof uniqueValidatorModule === 'function'
    ? uniqueValidatorModule
    : uniqueValidatorModule.default;

if (!mongooseUniqueValidator) {
  throw new Error('mongoose-unique-validator plugin could not be loaded');
}

export { mongooseUniqueValidator };
