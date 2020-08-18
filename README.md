<h3 align="center">
  @tailwindui/react
</h3>

<p align="center">
  ...
</p>

```tsx
<Transition>
  <div className="w-56"></div>
</Transition>
```

### Installation

```shell
npm install @tailwindui/react
```

### Usage

```tsx
import { Transition } from '@tailwindui/react';

<Transition
  show={true | false}
  enter=""
  enterFrom=""
  enterTo=""
  leave=""
  leaveFrom=""
  leaveTo=""
>
  <div className="w-56">{/* Content */}</div>
</Transition>;
```
