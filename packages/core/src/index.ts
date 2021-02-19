import Faumally from './Faumally';
import {createActor} from './actor';
import {createFormMachine} from './machine';
import _getContext from './get-context';

export type {Config, Schema, ValidationSchema, StorageAdapter} from './types';

export {
  Faumally,
  _getContext,
  createActor as _createActor,
  createFormMachine as _createFormMachine,
};
