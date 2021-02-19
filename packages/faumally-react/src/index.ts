import {useRef, useMemo} from 'react';
import {useService} from '@xstate/react';
import {Faumally, Config, _getContext} from 'faumally';

export default function useFaumally<T, K = unknown>(config: Config<T, K>) {
  const {service, generateHandlers, ...rest} = useRef(
    Faumally<T, K>(config)
  ).current;

  const [state] = useService(service);

  const context = useMemo(() => _getContext(state), [state]);

  const handlers = useMemo(generateHandlers, [config.schema]);

  return {
    ...rest,
    ...context,
    handlers,
  };
}
