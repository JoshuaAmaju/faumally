# `Faumally`

## Install

```bash
pnpm add faumally xstate
```

## Usage

```typescript
import Faumally from "faumally";

type Form = {
    age: number;
    email: string;
    address: string;
    lastName: string;
    firstName: string;
}

const createUser = (user: any) => Promise.resolve();

const config = {required: true}

const {submit, handlers, subscribe} = Faumally<Form>({
    schema: {
        email: config,
        lastName: config,
        firstName: config,
        address: 'string',
        age: {
            ...config,
            initialValue: 0
        },
    },
    onSubmit(data) {
        return createUser(data);
    }
})

subscribe(({data, error, errors, values, submit, isSubmitting, attemptedSaveOrSubmit}
) => {
    // do stuff anytime form state changes
    ...
})
```

### Return type

---

| name             | summary                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| handlers         | object containing event handlers corresponding to each item in the provided schema                                                                  |
| subscribe        | subscription function for changes to form state                                                                                                     |
| service          | the internal XState service behinde the form                                                                                                        |
| onChange         | generic form field edit event handler                                                                                                               |
| onBlur           | generic form field edit done event handler                                                                                                          |
| validate         | validate specific form field                                                                                                                        |
| generateHandlers | Handlers would not be generated in situation where schema is async e.g from an API request. You'd need to update and generate the handlers manually |
| set              | set values dynamically. Avaliable options are: `data`, `error`, `errors`, `values` and `schema`                                                     |

## Example

```typescript
const form = document.querySelector('form');
const email = form.querySelector('.email');
const age = form.querySelector('.age');
...

age.addEventListener('input', ({target: {value}}) => {
    handlers.age.onChange(value);
    // or
    onChange('age', value)
})

form.addEventListener('submit', e => {
    e.preventDefault();
    submit();
})

subscribe(({data, error, errors, values, isSubmitting, attemptedSaveOrSubmit}
) => {
    if (isSubmitting) alert('submitting form')

    if (attemptedSaveOrSubmit) {
        alert('Please fill all required fields')
    }
})
```
