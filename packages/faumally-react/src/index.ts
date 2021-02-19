import {useRef, useMemo} from 'react';
import {useService} from '@xstate/react';
import {useFaum, Config} from 'faumally';

export default function useFaumally<T, K = unknown>(config: Config<T, K>) {
  const {
    current: {service, generateHandlers, ...rest},
  } = useRef(useFaum(config));

  const [state] = useService(service);

  const {
    context: {data, values, errors, error, schema},
  } = state;

  const hasErrors = errors.size > 0;

  const isSaving = state.matches('saving');

  const isSubmitting = state.matches('submitting');

  const hasError = (name: keyof T) => errors.has(name);

  const handlers = useMemo(generateHandlers, [schema]);

  const attemptedSaveOrSubmit =
    state.matches('editing') &&
    (state.history?.matches('validatingActors') ||
      state.history?.matches('validating'));

  const saved =
    state.matches('editing') && state.history?.matches('saving') ? true : false;

  const submitted =
    state.matches('submitted') ||
    (state.matches('editing') && state.history?.matches('submitting'))
      ? true
      : false;

  return {
    ...rest,
    data,
    error,
    saved,
    values,
    errors,
    service,
    hasError,
    handlers,
    isSaving,
    submitted,
    hasErrors,
    isSubmitting,
    attemptedSaveOrSubmit,
  };
}
