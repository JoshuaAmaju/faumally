import {FaumRecord} from './types';
import {toLabel} from './utils';

type SchemaValidator<T = any> = (key: string, value: T) => string | void;

type Schema<T> = {[K in keyof T]: SchemaValidator<T[K]>};

const is = (type: string) => {
  return (value: any) => {
    return Object.prototype.toString.call(value) === type;
  };
};

const throwError = (error: any) => {
  return (cond: boolean) => {
    if (cond) throw error;
  };
};

const invoke = (key: string, value: any, validators: SchemaValidator[]) => {
  return validators.reduce(
    (_, validator) => validator(key, value) as any,
    null
  );
};

export namespace t {
  export const msg = (msg: string) => {
    return () => msg;
  };

  export const required = (
    ...validators: SchemaValidator[]
  ): SchemaValidator => {
    const isNull = is('[object Null]');
    const isUndefined = is('[object Undefined]');

    return (key, value) => {
      const msg = invoke(key, value, validators);

      throwError(msg ?? `${toLabel(key)} is required`)(
        isUndefined(value) || isNull(value)
      );
    };
  };

  export const isOfType = <T>(type: string) => (
    ...validators: SchemaValidator<T>[]
  ): SchemaValidator<T> => {
    const isString = is(`[object ${type}]`);

    return (key, value) => {
      const msg = invoke(key, value, validators);

      throwError(
        msg ?? `${toLabel(key)} should be of type: ${type.toLowerCase()}`
      )(!isString(value));
    };
  };

  export const string = isOfType<string>('String');

  export const number = isOfType<number>('Number');

  export const includes = <T>(ref: any) => (
    ...validators: SchemaValidator<T[]>[]
  ): SchemaValidator<T[]> => {
    return (key, value) => {
      const msg = invoke(key, value, validators);

      throwError(msg ?? `${toLabel(key)} should contain ${ref}`)(
        value.includes(ref)
      );
    };
  };

  export const schema = <T>(shape: Schema<T>) => {
    return (values: FaumRecord<T>) => {
      const errors = {} as any;

      Object.keys(values).forEach((key) => {
        const _key = key as keyof T;
        const validator = shape[_key];
        const value = values[_key];

        try {
          validator(key, value);
        } catch (error) {
          errors[key] = error;
        }
      });

      return errors;
    };
  };
}

type T = {
  email: string[];
};

const validate = t.schema<T>({
  email: t.includes('name')(),
});

// @ts-ignore
console.log(validate({email: 123}));
