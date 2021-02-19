import {interpret} from 'xstate';
import {createFormMachine, Context, Events, SetType} from './machine';
import {Config, StorageAdapter} from './types';

type SubscriberHelpers<T> = {
  saved: boolean;
  isSaving: boolean;
  hasErrors: boolean;
  submitted: boolean;
  isSubmitting: boolean;
  attemptedSaveOrSubmit?: boolean;
  hasError(name: keyof T): boolean;
};

type Subscriber<T> = (
  config: Omit<Context<T>, 'type' | 'actors' | 'schema' | 'validatedActors'> &
    SubscriberHelpers<T>
) => void;

type Handlers<T> = {
  [K in keyof T]: {
    validate(): void;
    onBlur(value: T[K] | null): void;
    onChange(value: T[K] | null): void;
  };
};

export default function Faumally<T = any, K = unknown>({
  autoSave = false,
  storageAdapter = localStorage as StorageAdapter,
  ...config
}: Config<T, K> & {storageAdapter?: StorageAdapter}) {
  const id = '$form';
  const service = interpret(createFormMachine<T, K>(config));

  const getEvents = async () => {
    const _events = await storageAdapter.getItem(id);
    return (JSON.parse(_events) ?? []) as Events<T, K>[];
  };

  const subscribe = (callback: Subscriber<T>) => {
    service.onTransition(async (state) => {
      const {
        context: {data, values, error, errors},
      } = state;

      const hasErrors = errors.size > 0;

      const isSaving = state.matches('saving');
      const isSubmitting = state.matches('submitting');

      const hasError = (name: keyof T) => errors.has(name);

      const attemptedSaveOrSubmit =
        state.matches('editing') &&
        (state.history?.matches('validatingActors') ||
          state.history?.matches('validating'));

      const saved =
        state.matches('editing') && state.history?.matches('saving')
          ? true
          : false;

      const submitted =
        state.matches('submitted') ||
        (state.matches('editing') && state.history?.matches('submitting'))
          ? true
          : false;

      callback({
        data,
        error,
        saved,
        errors,
        values,
        hasError,
        isSaving,
        hasErrors,
        submitted,
        isSubmitting,
        attemptedSaveOrSubmit,
      });

      const {
        event: {type},
      } = state;

      if (autoSave && state.changed && (type === 'BLUR' || type === 'EDIT')) {
        const events = await getEvents();
        storageAdapter.setItem(id, JSON.stringify(events.concat(state.event)));
      }
    });
  };

  const start = () => {
    service.start();
  };

  const stop = () => {
    service.stop();
  };

  const submit = () => {
    service.send('SUBMIT');
  };

  const set = (values: SetType<T, K>) => {
    service.send({type: 'SET', ...values});
  };

  const save = (validate?: boolean) => {
    service.send({type: 'SAVE', validate});
  };

  const validate = (name: keyof T) => {
    service.send({type: 'VALIDATE', name});
  };

  const onBlur = <K extends keyof T>(name: K, value: T[K] | null) => {
    service.send({type: 'BLUR', name, value});
  };

  const onChange = <K extends keyof T>(name: K, value: T[K] | null) => {
    service.send({type: 'EDIT', name, value});
  };

  const generateHandlers = () => {
    const handlers = {} as Handlers<T>;
    const {schema: _schema} = service.state.context;

    Object.keys(config.schema ?? _schema).forEach((key) => {
      const _key = key as keyof T;

      (handlers as any)[_key] = {
        // @ts-ignore
        onBlur: onBlur.bind(null, _key),

        // @ts-ignore
        onChange: onChange.bind(null, _key),

        validate: validate.bind(null, _key),
      };
    });

    return handlers;
  };

  start();

  const restoreState = async () => {
    const events = await getEvents();
    events.forEach((event) => service.send(event));
  };

  if (autoSave) restoreState();

  return {
    set,
    save,
    stop,
    start,
    submit,
    onBlur,
    service,
    validate,
    onChange,
    subscribe,
    restoreState,
    generateHandlers,
    handlers: generateHandlers(),
  };
}
