import {State} from 'xstate';
import {Context, Events, States} from './machine';

export default function getContext<T, K>(
  state: State<Context<T, K>, Events<T, K>, any, States<T, K>>
) {
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
    state.matches('editing') && state.history?.matches('saving') ? true : false;

  const submitted =
    state.matches('submitted') ||
    (state.matches('editing') && state.history?.matches('submitting'))
      ? true
      : false;

  return {
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
  };
}
