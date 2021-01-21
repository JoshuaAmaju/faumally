export type FaumRecord<T> = {[K in keyof T]: T[K]};

export type MaybeFaumRecord<T> = {[K in keyof T]: T[K] | undefined};

export type Schema<T> = {
  initialValue?: T;
  required?: boolean;
  validate?: (value: T | undefined) => string | void;
};

export type ValidationSchema<T> = {[K in keyof T]: string | Schema<T[K]>};

export type Config<T, K> = {
  once?: boolean;
  autoSave?: boolean;
  schema?: ValidationSchema<T>;
  onSubmit(values: FaumRecord<T>): Promise<K>;
  onSave?: (values: FaumRecord<T>) => void | Promise<void>;
  validate?: (values: MaybeFaumRecord<T>) => Record<keyof T, string> | void;
};

export type StorageAdapter = {
  removeItem(key: string): void | Promise<void>;
  getItem(key: string): string | Promise<string>;
  setItem(key: string, value: string): void | Promise<void>;
  [name: string]: any;
};
