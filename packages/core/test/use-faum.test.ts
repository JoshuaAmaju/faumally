import {StorageAdapter, Config, Faumally} from '../src';
import {Interpreter} from 'xstate';

type Faum = {
  name: string;
};

const storageAdapter: StorageAdapter = {
  getItem: () => '',
  setItem: () => {},
  removeItem: () => {},
};

const schema: Config<Faum, any> = {
  schema: {
    name: {
      required: true,
    },
  },
  onSubmit() {
    return Promise.resolve();
  },
};

describe('form machine wrapper', () => {
  it('verify returned service instance', () => {
    const {service} = Faumally({...schema, storageAdapter});
    expect(service).toBeInstanceOf(Interpreter);
  });

  it('verify returned form handlers', () => {
    const {handlers} = Faumally({...schema, storageAdapter});
    expect(handlers).toMatchObject({name: {}});
  });

  describe('form data handling', () => {
    it('values object should contain item name with value Joe', (done) => {
      const {handlers, subscribe} = Faumally({...schema, storageAdapter});

      handlers.name.onBlur('Joe');

      subscribe(({values}) => {
        expect(values.name).toBeDefined();
        expect(values).toStrictEqual({name: 'Joe'});
        done();
      });
    });

    it('errors object should contain name', (done) => {
      const {handlers, service} = Faumally({
        ...schema,
        storageAdapter,
      });

      handlers.name.onBlur(null);

      setTimeout(() => {
        const {errors, values} = service.state.context;
        expect(values.name).toBeNull();
        expect(errors.has('name')).toBeTruthy();
        done();
      }, 0);
    });
  });

  describe('form submission', () => {
    it('form submission data should be 1234', (done) => {
      const {submit, onChange, service} = Faumally({
        ...schema,
        storageAdapter,
        onSubmit() {
          return Promise.resolve(1234);
        },
      });

      onChange('name', 'Joe');

      submit();

      setTimeout(() => {
        const {data} = service.state.context;
        expect(data).toBe(1234);
        done();
      }, 0);
    });

    it('form submission should resolve with error', (done) => {
      const {submit, onChange, service} = Faumally({
        ...schema,
        storageAdapter,
        onSubmit() {
          return Promise.reject(new Error());
        },
      });

      onChange('name', 'Joe');

      submit();

      setTimeout(() => {
        const {error} = service.state.context;
        expect(error).toBeInstanceOf(Error);
        done();
      }, 0);
    });

    it('form should submit only once', (done) => {
      const {submit, onChange, service} = Faumally({
        ...schema,
        once: true,
        storageAdapter,
      });

      onChange('name', 'Joe');

      submit();

      setTimeout(() => {
        expect(service.state.value).toBe('submitted');
        done();
      }, 0);
    });
  });

  it('set schema/bulk values dynamically', (done) => {
    const {set, subscribe, service} = Faumally({
      storageAdapter,
      schema: {} as any,
      onSubmit: schema.onSubmit,
    });

    // subscribe(({values}) => {
    //   console.log(values);
    // });

    expect(service.state.context.values).toMatchObject({});

    set({
      name: 'schema',
      value: {
        name: {
          required: true,
          initialValue: '12345',
        },
      },
    });

    expect(service.state.context.values).toMatchObject({name: '12345'});

    setTimeout(done, 0);
  });
});
