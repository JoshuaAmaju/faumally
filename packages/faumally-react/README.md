# `@faumally/react`

## Installation

```bash
pnpm add faumally xstate @faumally/react @xstate/react
```

## Usage

```typescript
import {useFaumally} from '@faumally/react';

function App() {
  const {
    set,
    data,
    error,
    errors,
    values,
    submit,
    handlers,
    isSubmitting,
    attemptedSaveOrSubmit,
  } = useFaumally({
    schema: {
      email: config,
      lastName: config,
      firstName: config,
      address: 'string',
      age: {
        ...config,
        initialValue: 0,
      },
    },
    onSubmit(data) {
      return createUser(data);
    },
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <input
            type="text"
            name="name"
            onChange={({target: {value}}) => {
              handlers.name.onChange(value);
            }}
          />
          {errors.has('name') && <p>{errors.get('name')}</p>}
        </div>
        <div>
          <input
            type="email"
            name="email"
            onChange={({target: {value}}) => {
              handlers.email.onBlur(value);
            }}
          />
          {errors.has('email') && <p>{errors.get('email')}</p>}
        </div>
      </form>
    </div>
  );
}
```
