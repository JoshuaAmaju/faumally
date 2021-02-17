import {
  actions,
  assign,
  createMachine,
  send,
  spawn,
  SpawnedActorRef,
} from 'xstate';
import {createActor} from './actor';
import {Config, FaumRecord, ValidationSchema} from './types';
import {toSchema} from './utils';

const {choose, pure} = actions;

export type Context<T, K = unknown> = {
  data?: K;
  error?: Error;
  values: FaumRecord<T>;
  type: 'save' | 'submit';
  validatedActors: string[];
  schema: ValidationSchema<T>;
  errors: Map<keyof T, string>;
  actors: Record<keyof T, SpawnedActorRef<any>>;
};

export type SetType<T, K> =
  | {name: 'data'; value: Context<T, K>['data']}
  | {name: 'values'; value: Context<T, K>['values']}
  | {name: 'error'; value: Context<T, K>['error']}
  | {name: 'errors'; value: Context<T, K>['errors']}
  | {name: 'schema'; value: ValidationSchema<T>};

export type Events<T, K> =
  | {type: 'BLUR' | 'EDIT'; name: keyof T; value: T[keyof T] | null}
  | {type: 'ACTOR_ERROR'; name: keyof T; error: string}
  | ({type: 'SET'} & SetType<T, K>)
  | {type: 'ACTOR_NO_ERROR'; name: string}
  | {type: 'SAVE'; validate?: boolean}
  | {type: 'VALIDATE'; name: keyof T}
  | {type: 'SUBMIT'};

export type States<T, K = unknown> =
  | {
      value:
        | 'editing'
        | 'validating'
        | 'submitting'
        | 'validatingActors'
        | 'saving'
        | 'saved';
      context: Context<T, K>;
    }
  | {
      value: 'submitted';
      context: Context<T, K> & {data: K};
    };

const allActorsValidated = ({actors, validatedActors}: any) => {
  return validatedActors.length === Object.keys(actors).length;
};

export const createFormMachine = <T, K>({
  schema,
  onSave,
  onSubmit,
  validate,
  once = false,
}: Config<T, K>) => {
  return createMachine<Context<T, K>, Events<T, K>, States<T, K>>(
    {
      id: 'form',
      initial: 'editing',
      context: {
        type: 'submit',
        errors: new Map(),
        validatedActors: [],
        actors: {} as Context<T, K>['actors'],
        values: {} as Context<T, K>['values'],
        schema: schema ?? ({} as Context<T, K>['schema']),
      },
      entry: [
        'setInitialValues',
        choose([
          {
            actions: 'spawnActors',
            cond: () => Boolean(schema),
          },
        ]),
      ],
      on: {
        SET: {
          actions: [
            'setValue',
            choose([
              {
                actions: 'sendEditToActors',
                cond: (_, {name}) => name === 'values',
              },
              {
                actions: 'spawnActors',
                cond: (_, {name}) => name === 'schema',
              },
            ]),
          ],
        },
      },
      states: {
        editing: {
          on: {
            ACTOR_ERROR: {
              actions: 'assignActorError',
            },
            ACTOR_NO_ERROR: {
              actions: 'clearActorError',
            },
            BLUR: {
              actions: ['sendBlurToActor', 'assignValue'],
            },
            EDIT: {
              actions: ['sendEditToActor', 'assignValue'],
            },
            VALIDATE: {
              actions: 'sendValidateToActor',
            },
            SUBMIT: 'validatingActors',
            // SAVE: 'beforeSave',
          },

          // temporary work around for handling varying
          // transition target
          // always: [
          //   {
          //     target: 'validatingActors',
          //     actions: assign({type: (_) => 'save'}),
          //     cond: (_, {type, validate}: any) => {
          //       return type === 'SAVE' && validate;
          //     },
          //   },
          //   {
          //     target: 'saving',
          //     cond: (_, {type}) => type === 'SAVE',
          //   },
          // ],
        },
        validatingActors: {
          exit: 'clearMarkedActors',
          entry: 'sendValidateToActors',
          always: [
            {
              target: 'editing',
              cond: 'allActorsValidatedAndHasErrors',
            },
            {
              target: 'validating',
              cond: 'allActorsValidated',
            },
          ],
          on: {
            '*': {
              actions: [
                'markActor',
                choose([
                  {
                    cond: 'isErrorEvent',
                    actions: 'assignActorError',
                  },
                  {actions: 'clearActorError'},
                ]),
              ],
            },
          },
        },
        validating: {
          invoke: {
            src: 'validateForm',
            onDone: [
              {
                target: 'submitting',
                cond: ({type}) => type === 'submit',
              },
              {target: 'saving'},
            ],
            onError: {
              target: 'editing',
              actions: 'assignErrors',
            },
          },
        },
        submitting: {
          entry: 'clearError',
          invoke: {
            src: 'submitForm',
            onDone: [
              {
                target: 'submitted',
                actions: 'assignData',
                cond: () => once,
              },
              {
                target: 'editing',
                actions: 'assignData',
              },
            ],
            onError: {
              target: 'editing',
              actions: 'assignError',
            },
          },
        },
        saving: {
          invoke: {
            src: 'saveForm',
            onDone: [
              {
                target: 'saved',
                cond: () => once,
              },
              {target: 'editing'},
            ],
            onError: {
              target: 'editing',
              actions: 'assignError',
            },
          },
        },
        saved: {
          type: 'final',
        },
        submitted: {
          type: 'final',
          data: ({data}) => data,
        },
      },
    },
    {
      guards: {
        allActorsValidated,
        isErrorEvent: (_, {type}) => type === 'ACTOR_ERROR',
        allActorsValidatedAndHasErrors: ({errors, ...ctx}) => {
          return allActorsValidated(ctx) && errors.size > 0;
        },
      },
      actions: {
        assignData: assign({data: (_, {data}: any) => data}),
        assignError: assign({error: (_, {data}: any) => data}),
        clearError: assign((ctx) => ({...ctx, error: undefined})),

        sendBlurToActor: send((_, e) => ({...e, validate: true}), {
          to: (_, {name}: any) => name,
        }),

        sendEditToActor: send((_, e) => e, {
          to: (_, {name}: any) => name,
        }),

        sendValidateToActor: send('VALIDATE', {
          to: (_, {name}: any) => name,
        }),

        setValue: assign((ctx, {name, value}: any) => {
          console.log('machine', name, value);

          return {...ctx, [name]: value};
        }),

        assignValue: assign({
          values: ({values}, {name, value}: any) => {
            return {...values, [name]: value};
          },
        }),

        assignErrors: assign({
          errors: (_, {data}: any) => data,
        }),

        assignActorError: assign({
          errors: ({errors}, {name, error}: any) => {
            const errs = new Map(errors);
            errs.set(name, error);
            return errs;
          },
        }),

        clearActorError: assign({
          errors: ({errors}, {name}: any) => {
            const errs = new Map(errors);
            errs.delete(name);
            return errs;
          },
        }),

        sendEditToActors: pure(({actors}, {value}: any) => {
          return Object.keys(actors).map((key) => {
            return send({type: 'EDIT', value: value?.[key]}, {to: key});
          });
        }),

        sendValidateToActors: pure(({actors}) => {
          return Object.keys(actors).map((key) => {
            return send('VALIDATE', {to: key});
          });
        }),

        markActor: assign({
          validatedActors: ({validatedActors}, {type, name}: any) => {
            return [...validatedActors, name];
          },
        }),

        clearMarkedActors: assign((ctx) => ({...ctx, validatedActors: []})),

        // assignSchema: assign((ctx, {value}: any) => {
        //   return {...ctx, schema: value};
        // }),

        setInitialValues: assign(({schema, ...ctx}) => {
          const values = {} as Context<T, K>['values'];

          Object.keys(schema).forEach((k) => {
            const key = k as keyof T;
            const {initialValue} = toSchema(schema[key]);
            values[key] = initialValue;
          });

          return {...ctx, values};
        }),

        spawnActors: assign(({schema, ...ctx}) => {
          const actors = {} as Context<T, K>['actors'];

          Object.keys(schema).forEach((key) => {
            const _key = key as keyof T;
            const value = toSchema(schema[_key]);
            actors[_key] = spawn(createActor(key, value), key);
          });

          return {...ctx, actors};
        }),
      },
      services: {
        submitForm({values}) {
          return onSubmit(values);
        },
        async saveForm({values}) {
          return onSave?.(values);
        },
        validateForm({values}) {
          let errors = validate?.(values);

          if (errors && Object.values(errors).length > 0) {
            const entries = Object.entries(errors);
            return Promise.reject(new Map(entries));
          }

          return Promise.resolve();
        },
      },
    }
  );
};
