import {useRef, useMemo} from 'react';
import {useService} from '@xstate/react';
import {Faumally, Config, _getContext} from 'faumally';

export default function useFaumally<T, K = unknown>(config: Config<T, K>) {
  const {
    current: {service, generateHandlers, ...rest},
  } = useRef(Faumally(config));

  const [state] = useService(service);

  const context = _getContext(state);

  const handlers = useMemo(generateHandlers, [config.schema]);

  return {
    ...rest,
    ...context,
    handlers,
  };
}
