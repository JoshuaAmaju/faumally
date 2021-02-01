import {FaumRecord} from './types';
import {toLabel} from './utils';

type UnCurriedSchemaValidator<T = any> = (
  key: string,
  value: T
) => string | void;

type CurriedSchemaValidator<T = any> = () => UnCurriedSchemaValidator<T>;

type SchemaValidator<T = any> =
  | UnCurriedSchemaValidator<T[keyof T]>
  | CurriedSchemaValidator<T[keyof T]>;

type Schema<T> = {
  [K in keyof T]: SchemaValidator<T>;
};

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
  return validators.reduce((_, validator) => {
    console.log(typeof validator, validator);

    const a = typeof validator === 'function' && (validator(key, value) as any);

    console.log(a);

    if (typeof a === 'function') {
      return a(key, value);
    }

    return a;
  }, null);
};

export namespace t {
  export const msg = (msg: string) => {
    return () => msg;
  };

  export const required = (
    ...validators: SchemaValidator[]
  ): UnCurriedSchemaValidator => {
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
  ): UnCurriedSchemaValidator<T> => {
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
  ): UnCurriedSchemaValidator<T[]> => {
    return (key, value) => {
      const msg = invoke(key, value, validators);

      throwError(msg ?? `${toLabel(key)} should contain ${ref}`)(
        !value.includes(ref)
      );
    };
  };

  export const has = <T extends Map<string, unknown>>(ref: any) => (
    ...validators: SchemaValidator<T[]>[]
  ): UnCurriedSchemaValidator<T> => {
    return (key, value) => {
      const msg = invoke(key, value, validators);

      throwError(msg ?? `${toLabel(key)} should contain ${ref}`)(
        !value.has(ref)
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
          const a = validator(key, value);

          if (typeof a === 'function') {
            (validator as CurriedSchemaValidator)()(key, value);
          }
        } catch (error) {
          errors[key] = error;
        }
      });

      return errors;
    };
  };
}

type T = {
  email: Map<string, string>;
};

const validate = t.schema<T>({
  email: t.has('name'),
});

console.log(validate({email: new Map([['hjdk', 'gh']])}));
