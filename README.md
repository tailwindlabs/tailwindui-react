<h3 align="center">
  @tailwindui/react
</h3>

<p>
  A set of completely unstyled, fully accessible UI components for React.js, designed to integrate
  beautifully with Tailwind CSS.
</p>
<p>
  You bring the styles and the markup, we handle all of the complex keyboard interactions and ARIA
  management.
</p>

<p>
  <a href="https://www.npmjs.com/package/@tailwindui/react"><img src="https://img.shields.io/npm/dt/@tailwindui/react.svg" alt="Total Downloads"></a>
  <a href="https://github.com/tailwindlabs/tailwindui-react/releases"><img src="https://img.shields.io/npm/v/@tailwindui/react.svg" alt="Latest Release"></a>
  <a href="https://github.com/tailwindlabs/tailwindui-react/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@tailwindui/react.svg" alt="License"></a>
</p>

## Installation

```shell
# npm
npm install @tailwindui/react

# Yarn
yarn add @tailwindui/react
```

## Components

> This project is still in early development. More components will be added in the coming months.

- [Transition](#transition)

### Transition

The transition component is a component that allows you to use enter/leave transitions. It also
allows you to coordinate transitions based on application state.

```jsx
import { Transition } from '@tailwindui/react'

function MyComponent() {
  return (
    <Transition
      show={true | false}
      enter="transform-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transform-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      I will fade in and out
    </Transition>
  )
}
```

#### Usage

> By default we will render a `div` where we can apply the correct classes to. We do this because we
> want direct access to the DOM node to improve performance.

```tsx
import { Transition } from '@tailwindui/react'

function MyComponent() {
  return (
    <Transition
      show={true | false}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {/* Your content goes here*/}
    </Transition>
  )
}
```

If you don't want a `div` being rendered, then you can also change the underlying DOM node with
another node. This can be achieved using the `as` prop.

```tsx
import { Transition } from '@tailwindui/react'

function MyComponent() {
  return (
    <Transition
      show={true | false}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      // All HTMLElements are allowed
      as="a"
    >
      {/* Your content goes here*/}
    </Transition>
  )
}
```

We also have the ability to add the following (optional) classes:

- **enter**: will be applied for the enter transitions. Usually you define your duration and what
  you want to transition here. E.g.: `transition-colors duration-75`.
- **enterFrom**: define the start position of your enter transition. E.g.: `opacity-0`.
- **enterTo**: define the end position of your enter transition. E.g.: `opacity-100`.
- **leave**: will be applied for the leave transitions. Usually you define your duration and what
  you want to transition here. E.g.: `transition-colors duration-75`.
- **leaveFrom**: define the start position of your leave transition. E.g.: `opacity-100`.
- **leaveTo**: define the end position of your leave transition. E.g.: `opacity-0`.

---

If you don't want an extra element at all then you can use the render prop version of the component:

```tsx
import { Transition } from '@tailwindui/react'

function MyComponent() {
  return (
    <Transition
      show={true | false}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {ref => <div ref={ref}>{/* Your content goes here*/}</div>}
    </Transition>
  )
}
```

Now you are in control of what is being rendered.

> **Note:** We use `ref.current.classList.{add,remove}` under the hood so make sure you passthrough
> the `ref` to an actual DOM Element.

---

If you want to transition multiple items based on the same state then you can use a `<Transition />`
component and nested `<Transition.Child />` components which inherit the `show` property.

- Both the `<Transition />` and `<Transition.Child />` have the same API, meaning you can apply the classes, the custom `as` prop or the render prop function.
- If you want to, in addition, also transition the root `<Transition />` you can simply add the aforementioned `enter`, `enterFrom`, `enterTo`, `leave`, `leaveFrom` and `leaveTo` classes.

```tsx
import { Transition } from '@tailwindui/react'

function Sidebar({ isOpen }) {
  return (
    <Transition show={isOpen}>
      {/* Shared parent */}
      <div>
        {/* Background overlay */}
        <Transition.Child
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* ... */}
        </Transition.Child>

        {/* Sliding sidebar */}
        <Transition.Child
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          {/* ... */}
        </Transition.Child>
      </div>
    </Transition>
  )
}
```

> **Note:** Nesting `<Transition.Child />` components is also possible, this will ensure that all
> transitions from deeply nested children are finished first.

---

Sometimes you need the ability to transition on first mount, for example when you have a `Notification` component. In that case you can enable the `appear={true}` prop. By default this is set to false since this is a more common use case.

```tsx
import { Transition } from '@tailwindui/react'

function MyComponent() {
  return (
    <Transition
      appear={true}
      show={true | false}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {ref => <div ref={ref}>{/* Your content goes here*/}</div>}
    </Transition>
  )
}
```

### Contributing

1. Make sure you write tests.
2. You can start a playground using `yarn playground` or `npm run playground`.
3. When you commit, ensure that you follow the conventional commit structure
   (https://www.conventionalcommits.org/) `yarn commit` or `npm run commit` will help you.
