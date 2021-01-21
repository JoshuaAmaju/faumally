import {assign, createMachine, sendParent} from 'xstate';
import {Schema} from './types';
import {toLabel} from './utils';

type Context<T> = {
  value?: T | undefined;
} & Omit<Schema<any>, 'initialValue'>;

type Events<T> =
  | {type: 'BLUR' | 'EDIT'; value: T; validate?: boolean}
  | {type: 'VALIDATE'};

type States<T> = {value: 'editing' | 'validating'; context: Context<T>};

const createActor = <T>(
  name: string,
  {validate, required, initialValue}: Schema<T>
) => {
  return createMachine<Context<T>, Events<T>, States<T>>(
    {
      id: `${name}-actor`,
      initial: 'editing',
      context: {
        value: initialValue,
      },
      states: {
        editing: {
          on: {
            VALIDATE: 'validating',
            BLUR: {
              target: 'validating',
              actions: 'assignValue',
            },
            EDIT: {
              actions: 'assignValue',
            },
          },
        },
        validating: {
          invoke: {
            src: 'validate',
            onDone: {
              target: 'editing',
              actions: 'notifySuccess',
            },
            onError: {
              target: 'editing',
              actions: 'notifyError',
            },
          },
        },
      },
    },
    {
      actions: {
        assignValue: assign({
          value: (_, {value}: any) => value,
        }),
        notifyError: sendParent((_, {data}: any) => ({
          name,
          error: data,
          type: 'ACTOR_ERROR',
        })),
        notifySuccess: sendParent((_) => ({
          name,
          type: 'ACTOR_NO_ERROR',
        })),
      },
      services: {
        validate({value}) {
          const res = validate?.(value);

          if (res) {
            return Promise.reject(res);
          }

          const label = toLabel(name);

          if (required && !value) {
            return Promise.reject(`${label} is required.`);
          }

          return Promise.resolve();
        },
      },
    }
  );
};

export default createActor;
