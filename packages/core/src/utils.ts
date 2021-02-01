import {Schema} from './types';

export function toLabel(name: string) {
  return name.charAt(0).toUpperCase() + name.substr(1);
}

export function toSchema(value: string | Schema<any>) {
  return typeof value === 'string' ? {} : value;
}
