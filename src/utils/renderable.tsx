import * as React from 'react'
import { AsRenderProp, AsShortcut } from '../types'

// function Item<TTag extends React.ElementType = 'div'>(props: Renderable<TTag, {
//   props:
// }>) {
//   return render<typeof props>(props, { extra: 'info' })
// }

// Use case 1: A default item
// <Item />

// Use case 2: An item with a render prop
// <Item>{(args) => {}}</Item>    // Args should be typed

// Use case 3: An item with an `as` prop
// <Item as="a" href="/"></div>   // Becauase of the `as` prop set to "a" we should get code completion for an `href`.

export function isRenderProp<TBag>(props: any): props is Required<AsRenderProp<TBag>> {
  return typeof props.children === 'function'
}

function isAsShortcut<TTag, TOmitableProps extends keyof any = any>(
  _props: any
): _props is AsShortcut<TTag, TOmitableProps> {
  return true
}

export function render<T extends React.ElementType, TBag>(
  props: AsShortcut<T> | AsRenderProp<TBag>,
  bag: TBag,
  tag: React.ElementType
) {
  if (isRenderProp(props)) {
    const { children, ...rest } = props
    const returnValue = props.children(bag)

    return React.cloneElement(
      returnValue,

      // Filter out undefined values so that they don't override the existing values
      Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined))
    )
  }

  if (isAsShortcut(props)) {
    const { as: Component = tag, ...rest } = props
    return <Component {...rest} />
  }

  return null
}

/**
 * This is a hack, but basically we want to keep the full 'API' of the component, but we do want to
 * wrap it in a forwardRef so that we _can_ passthrough the ref
 */
export function forwardRefWithAs<T>(component: T): T {
  return React.forwardRef((component as unknown) as any) as any
}
