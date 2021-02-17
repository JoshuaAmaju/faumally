import {useRef, useMemo} from 'react';
import {useService} from '@xstate/react';
import {useFaum, Config} from 'faumally';

export default function useFaumally<T, K = unknown>(config: Config<T, K>) {
  const {
    current: {service, ...rest},
  } = useRef(useFaum(config));

  const [state] = useService(service);

  const {
    context: {data, values, errors, error},
  } = state;

  const hasErrors = errors.size > 0;

  const isSubmitting = state.matches('submitting');

  const hasError = (name: keyof T) => errors.has(name);

  // const handlers = useMemo(genera);

  return {
    ...rest,
    data,
    error,
    values,
    errors,
    hasError,
    hasErrors,
    isSubmitting,
  };
}
