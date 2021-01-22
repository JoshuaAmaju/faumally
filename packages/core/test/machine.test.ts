import {interpret, StateMachine} from 'xstate';
import {createFormMachine} from '../src';
import {Context, Events, States} from '../src/machine';

type Schema = {
  name: string;
};

let machine: StateMachine<
  Context<Schema, any>,
  States<Schema, any>,
  Events<Schema, any>
>;

beforeEach(() => {
  machine = createFormMachine<Schema, any>({
    schema: {
      name: {
        required: true,
      },
    },
    onSubmit() {
      return Promise.resolve();
    },
  });
});

describe('form machine', () => {
  describe('assigning of values', () => {
    it('values should be an object with name set to undefined', (done) => {
      const service = interpret(machine).start();

      expect(service.state.context.values.name).toBeUndefined();
      expect(service.state.context.values).toStrictEqual({
        name: undefined,
      });

      done();
    });

    it('name should be John Doe', (done) => {
      const service = interpret(machine).start();

      service.send({type: 'BLUR', name: 'name', value: 'John Doe'});

      expect(service.state.context.values.name).toBe('John Doe');

      done();
    });

    it('spawn form machine with name of initial value set to John Doe', (done) => {
      const service = interpret(
        createFormMachine<Schema, any>({
          schema: {
            name: {
              required: true,
              initialValue: 'John Doe',
            },
          },
          onSubmit() {
            return Promise.resolve();
          },
        })
      ).start();

      expect(service.state.context.values.name).toBe('John Doe');

      done();
    });
  });

  describe('error checking', () => {
    it('context error object should contain values with error', (done) => {
      const service = interpret(machine).start();

      service.send({type: 'BLUR', name: 'name', value: null});

      setTimeout(() => {
        expect(service.state.context.errors.has('name')).toBeTruthy();

        done();
      }, 0);
    });

    it('should notify of errors in fields on submit', (done) => {
      const service = interpret(machine).start();

      service.send({type: 'EDIT', name: 'name', value: null});

      expect(service.state.context.errors.size).toBe(0);

      service.send('SUBMIT');

      setTimeout(() => {
        expect(service.state.context.errors.has('name')).toBeTruthy();

        done();
      }, 0);
    });
  });

  describe('form submission', () => {
    it('ensure form is submitted once', () => {
      const service = interpret(
        createFormMachine({
          schema: {},
          once: true,
          onSubmit() {
            return Promise.resolve();
          },
        })
      ).start();

      service.send('SUBMIT');

      setTimeout(() => {
        expect(service.state.value).toBe('submitted');
      }, 0);
    });

    it('result of form submission should be 1234', () => {
      const service = interpret(
        createFormMachine({
          schema: {},
          onSubmit() {
            return Promise.resolve(1234);
          },
        })
      ).start();

      service.send('SUBMIT');

      setTimeout(() => {
        expect(service.state.context.data).toBe(1234);
      }, 0);
    });

    it('check for form submission error', () => {
      const service = interpret(
        createFormMachine({
          schema: {},
          onSubmit() {
            return Promise.reject('An error occured');
          },
        })
      ).start();

      service.send('SUBMIT');

      setTimeout(() => {
        expect(service.state.context.error).toBeDefined();
        expect(service.state.context.error).toBe('An error occured');
      }, 0);
    });

    it('form should not submit because of field error', () => {
      const service = interpret(machine).start();

      service.send({type: 'EDIT', name: 'name', value: null});

      service.send('SUBMIT');

      setTimeout(() => {
        expect(service.state.value).toBe('editing');
        expect(service.state.context.errors).toBeDefined();
        expect(service.state.context.errors.has('name')).toBe(true);
      }, 0);
    });
  });
});
