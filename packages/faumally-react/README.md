# `@faumally/react`

> React hooks for form handling backed by state machines

## Usage

```typescript
import useFaumally from "@faumally/react";

type Form = {
  age: number;
  email: string;
  address: string;
  lastName: string;
  firstName: string;
};

const config = { required: true };

const createUser = (user: any) => Promise.resolve();

const { submit, handlers, subscribe } = useFaumally<Form>({
  schema: {
    email: config,
    lastName: config,
    firstName: config,
    address: "string",
    age: {
      ...config,
      initialValue: 0,
    },
  },
  onSubmit(data) {
    return createUser(data);
  },
});
```
