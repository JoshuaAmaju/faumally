import { useRef } from "react";
import { useService } from "@xstate/react";
import { useFaum } from "faumally";

export default function useFaumally<T, K = unknown>(config: Config<T, K>) {
  const {
    current: { service, ...rest },
  } = useRef(useFaum(config));

  const [state] = useService(service) as any;

  const {
    context: { data, values, errors, error },
  } = state;

  const hasErrors = errors.size > 0;

  const isSubmitting = state.matches("submitting");

  const hasError = (name: keyof T) => errors.has(name);

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
