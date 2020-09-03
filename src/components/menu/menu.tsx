// WAI-ARIA: https://www.w3.org/TR/wai-aria-practices-1.2/#menubutton
import * as React from 'react'

import { AsShortcut, PropsOf } from '../../types'
import { match } from '../../utils/match'
import { Transition, TransitionClasses } from '../transitions/transition'
import { useDisposables } from '../../hooks/use-disposables'
import { useIsoMorphicEffect } from '../../hooks/use-iso-morphic-effect'
import { useSyncRefs } from '../../hooks/use-sync-refs'
import { useId } from '../../hooks/use-id'

enum MenuStates {
  Open,
  Closed,
}

// TODO: This must already exist somewhere, right? 🤔
// Ref: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
enum Key {
  Space = ' ',
  Enter = 'Enter',
  Escape = 'Escape',
  Backspace = 'Backspace',

  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',

  Home = 'Home',
  End = 'End',

  PageUp = 'PageUp',
  PageDown = 'PageDown',

  Tab = 'Tab',
}

type MenuItemDataRef = React.MutableRefObject<{ textValue?: string; disabled: boolean }>

type StateDefinition = {
  menuState: MenuStates
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>
  itemsRef: React.MutableRefObject<HTMLDivElement | null>
  items: { id: string; dataRef: MenuItemDataRef }[]
  searchQuery: string
  activeItemIndex: number | null
}

enum ActionTypes {
  ToggleMenu,
  OpenMenu,
  CloseMenu,

  GoToItem,
  Search,
  ClearSearch,

  RegisterItem,
  UnregisterItem,
}

enum Focus {
  FirstItem,
  PreviousItem,
  NextItem,
  LastItem,
  SpecificItem,
  Nothing,
}

function calculateActiveItemIndex(
  state: StateDefinition,
  focus: Focus,
  id?: string
): StateDefinition['activeItemIndex'] {
  if (state.items.length <= 0) return null

  const items = state.items
  const activeItemIndex = state.activeItemIndex ?? -1

  const nextActiveIndex = match(focus, {
    [Focus.FirstItem]: () => items.findIndex(item => !item.dataRef.current.disabled),
    [Focus.PreviousItem]: () => {
      const idx = items
        .slice()
        .reverse()
        .findIndex((item, idx, all) => {
          if (activeItemIndex !== -1 && all.length - idx - 1 >= activeItemIndex) return false
          return !item.dataRef.current.disabled
        })
      if (idx === -1) return idx
      return items.length - 1 - idx
    },
    [Focus.NextItem]: () => {
      return items.findIndex((item, idx) => {
        if (idx <= activeItemIndex) return false
        return !item.dataRef.current.disabled
      })
    },
    [Focus.LastItem]: () => {
      const idx = items
        .slice()
        .reverse()
        .findIndex(item => !item.dataRef.current.disabled)
      if (idx === -1) return idx
      return items.length - 1 - idx
    },
    [Focus.SpecificItem]: () => items.findIndex(item => item.id === id),
    [Focus.Nothing]: () => null,
  })

  if (nextActiveIndex === -1) return state.activeItemIndex
  return nextActiveIndex
}

type Actions =
  | { type: ActionTypes.ToggleMenu }
  | { type: ActionTypes.CloseMenu }
  | { type: ActionTypes.OpenMenu }
  | { type: ActionTypes.GoToItem; focus: Focus; id?: string }
  | { type: ActionTypes.Search; value: string }
  | { type: ActionTypes.ClearSearch }
  | { type: ActionTypes.RegisterItem; id: string; dataRef: MenuItemDataRef }
  | { type: ActionTypes.UnregisterItem; id: string }

const reducers: {
  [P in ActionTypes]: (
    state: StateDefinition,
    action: Extract<Actions, { type: P }>
  ) => StateDefinition
} = {
  [ActionTypes.ToggleMenu]: state => ({
    ...state,
    menuState: match(state.menuState, {
      [MenuStates.Open]: MenuStates.Closed,
      [MenuStates.Closed]: MenuStates.Open,
    }),
  }),
  [ActionTypes.CloseMenu]: state => ({ ...state, menuState: MenuStates.Closed }),
  [ActionTypes.OpenMenu]: state => ({ ...state, menuState: MenuStates.Open }),
  [ActionTypes.GoToItem]: (state, action) => {
    const activeItemIndex = calculateActiveItemIndex(state, action.focus, action.id)

    if (state.searchQuery === '' && state.activeItemIndex === activeItemIndex) {
      return state
    }

    return {
      ...state,
      searchQuery: '',
      activeItemIndex,
    }
  },
  [ActionTypes.Search]: (state, action) => {
    const searchQuery = state.searchQuery + action.value
    const match = state.items.findIndex(
      item =>
        item.dataRef.current.textValue?.startsWith(searchQuery) && !item.dataRef.current.disabled
    )

    if (match === -1 || match === state.activeItemIndex) {
      return { ...state, searchQuery }
    }

    return {
      ...state,
      searchQuery,
      activeItemIndex: match,
    }
  },
  [ActionTypes.ClearSearch]: state => ({ ...state, searchQuery: '' }),
  [ActionTypes.RegisterItem]: (state, action) => ({
    ...state,
    items: [...state.items, { id: action.id, dataRef: action.dataRef }],
  }),
  [ActionTypes.UnregisterItem]: (state, action) => {
    const nextItems = state.items.slice()
    const currentActiveItem =
      state.activeItemIndex !== null ? nextItems[state.activeItemIndex] : null

    const idx = nextItems.findIndex(a => a.id === action.id)

    if (idx !== -1) nextItems.splice(idx, 1)

    return {
      ...state,
      items: nextItems,
      activeItemIndex: (() => {
        if (idx === state.activeItemIndex) return null
        if (currentActiveItem === null) return null

        // If we removed the item before the actual active index, then it would be out of sync. To
        // fix this, we will find the correct (new) index position.
        return nextItems.indexOf(currentActiveItem)
      })(),
    }
  },
}

const MenuContext = React.createContext<[StateDefinition, React.Dispatch<Actions>] | null>(null)

function useMenuContext(component: string) {
  const context = React.useContext(MenuContext)
  if (context === null) {
    const err = new Error(`<${component} /> is missing a parent <${Menu.name} /> component.`)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, useMenuContext)
    }
    throw err
  }
  return context
}

const defaultState: StateDefinition = {
  menuState: MenuStates.Closed,
  buttonRef: React.createRef(),
  itemsRef: React.createRef(),
  items: [],
  searchQuery: '',
  activeItemIndex: null,
}

function stateReducer(state: StateDefinition, action: Actions) {
  return match(action.type, reducers, state, action)
}

export function Menu(props: { children: React.ReactNode }) {
  const d = useDisposables()
  const reducerBag = React.useReducer(stateReducer, defaultState)
  const [{ menuState, itemsRef, buttonRef }, dispatch] = reducerBag

  React.useEffect(() => {
    function handler(event: PointerEvent) {
      if (event.defaultPrevented) return
      if (menuState !== MenuStates.Open) return

      if (!itemsRef.current?.contains(event.target as HTMLElement)) {
        dispatch({ type: ActionTypes.CloseMenu })
        d.nextFrame(() => buttonRef.current?.focus())
      }
    }

    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [menuState, itemsRef, buttonRef, d, dispatch])

  return <MenuContext.Provider value={reducerBag}>{props.children}</MenuContext.Provider>
}

// ---

type ButtonPropsWeControl =
  | 'ref'
  | 'id'
  | 'type'
  | 'aria-haspopup'
  | 'aria-controls'
  | 'aria-expanded'
  | 'onKeyDown'
  | 'onFocus'
  | 'onPointerUp'
  | 'onPointerDown'

const Button = React.forwardRef<HTMLButtonElement, Omit<PropsOf<'button'>, ButtonPropsWeControl>>(
  function Button(props, ref) {
    const [state, dispatch] = useMenuContext([Menu.name, Button.name].join('.'))
    const buttonRef = useSyncRefs(state.buttonRef, ref)

    const id = `tailwindui-menu-button-${useId()}`
    const d = useDisposables()

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13

        case Key.Space:
        case Key.Enter:
        case Key.ArrowDown:
          event.preventDefault()
          dispatch({ type: ActionTypes.OpenMenu })
          d.nextFrame(() => {
            state.itemsRef.current?.focus()
            dispatch({ type: ActionTypes.GoToItem, focus: Focus.FirstItem })
          })
          break

        case Key.ArrowUp:
          event.preventDefault()
          dispatch({ type: ActionTypes.OpenMenu })
          d.nextFrame(() => {
            state.itemsRef.current?.focus()
            dispatch({ type: ActionTypes.GoToItem, focus: Focus.LastItem })
          })
          break
      }
    }

    function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      // We have a `pointerdown` event listener in the menu for the 'outside click', so we just want
      // to prevent going there if we happen to click this button.
      event.preventDefault()
    }

    function handlePointerUp() {
      dispatch({ type: ActionTypes.ToggleMenu })
      d.nextFrame(() => state.itemsRef.current?.focus())
    }

    function handleFocus() {
      if (state.menuState === MenuStates.Open) state.itemsRef.current?.focus()
    }

    return (
      <button
        {...props}
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup={true}
        aria-controls={state.itemsRef.current?.id}
        aria-expanded={state.menuState === MenuStates.Open ? true : undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDown}
      />
    )
  }
)

// ---

type ItemsPropsWeControl =
  | 'aria-activedescendant'
  | 'aria-labelledby'
  | 'id'
  | 'onKeyDown'
  | 'ref'
  | 'role'
  | 'tabIndex'

const Items = React.forwardRef<HTMLDivElement, Omit<PropsOf<'div'>, ItemsPropsWeControl>>(
  function Items(props, ref) {
    const [state, dispatch] = useMenuContext([Menu.name, Items.name].join('.'))
    const itemsRef = useSyncRefs(state.itemsRef, ref)

    const id = `tailwindui-menu-items-${useId()}`
    const d = useDisposables()
    const searchDisposables = useDisposables()

    function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      searchDisposables.dispose()

      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-12

        case Key.Enter:
          dispatch({ type: ActionTypes.CloseMenu })
          if (state.activeItemIndex !== null) {
            const { id } = state.items[state.activeItemIndex]
            document.getElementById(id)?.click()
            d.nextFrame(() => state.buttonRef.current?.focus())
          }
          break

        case Key.ArrowDown:
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.NextItem })

        case Key.ArrowUp:
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.PreviousItem })

        case Key.Home:
        case Key.PageUp:
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.FirstItem })

        case Key.End:
        case Key.PageDown:
          return dispatch({ type: ActionTypes.GoToItem, focus: Focus.LastItem })

        case Key.Escape:
          dispatch({ type: ActionTypes.CloseMenu })
          d.nextFrame(() => state.buttonRef.current?.focus())
          break

        case Key.Tab:
          return event.preventDefault()

        default:
          if (event.key.length === 1) {
            dispatch({ type: ActionTypes.Search, value: event.key })
            searchDisposables.setTimeout(() => dispatch({ type: ActionTypes.ClearSearch }), 350)
          }
          break
      }
    }

    return (
      <Transition show={state.menuState === MenuStates.Open}>
        {ref => (
          <div
            {...props}
            aria-activedescendant={
              state.activeItemIndex === null ? undefined : state.items[state.activeItemIndex]?.id
            }
            aria-labelledby={state.buttonRef.current?.id}
            id={id}
            onKeyDown={handleKeyDown}
            ref={divRef => {
              ref.current = divRef
              itemsRef(divRef)
            }}
            role="menu"
            tabIndex={0}
          />
        )}
      </Transition>
    )
  }
)

// ---

const DEFAULT_ITEM_TAG = 'a'

type MenuItemPropsWeControl =
  | 'id'
  | 'role'
  | 'tabIndex'
  | 'aria-disabled'
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerUp'
  | 'onFocus'

function Item<TTag extends React.ElementType = typeof DEFAULT_ITEM_TAG>(
  props: Omit<AsShortcut<TTag>, MenuItemPropsWeControl | 'className'> & {
    disabled?: boolean
    as?: TTag

    // Special treatment, can either be a string or a function that resolves to a string
    className?: ((bag: { active: boolean; disabled: boolean }) => string) | string
  }
) {
  const { as: Component = DEFAULT_ITEM_TAG, disabled = false, className, onClick, ...rest } = props
  const [state, dispatch] = useMenuContext([Menu.name, Item.name].join('.'))
  const d = useDisposables()
  const id = `tailwindui-menu-item-${useId()}`
  const active =
    state.activeItemIndex !== null ? state.items[state.activeItemIndex].id === id : false

  const bag = React.useRef<MenuItemDataRef['current']>({ disabled: disabled })

  useIsoMorphicEffect(() => {
    bag.current.disabled = disabled
  }, [bag, disabled])

  useIsoMorphicEffect(() => {
    bag.current.textValue = document.getElementById(id)?.textContent?.toLowerCase()
  }, [bag, id])

  useIsoMorphicEffect(() => {
    dispatch({ type: ActionTypes.RegisterItem, id, dataRef: bag })
    return () => dispatch({ type: ActionTypes.UnregisterItem, id })
  }, [bag, id])

  const handlePointerEnter = React.useCallback(() => {
    if (disabled) return
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.SpecificItem, id })
  }, [disabled, id, dispatch])

  const handleFocus = React.useCallback(() => {
    if (disabled) return dispatch({ type: ActionTypes.GoToItem, focus: Focus.Nothing })
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.SpecificItem, id })
  }, [disabled, id, dispatch])

  const handlePointerLeave = React.useCallback(() => {
    if (disabled) return
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.Nothing })
  }, [disabled, dispatch])

  const handleMouseMove = React.useCallback(() => {
    if (disabled) return
    if (active) return
    dispatch({ type: ActionTypes.GoToItem, focus: Focus.SpecificItem, id })
  }, [disabled, active, id, dispatch])

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled) return
      event.preventDefault()
      dispatch({ type: ActionTypes.CloseMenu })
      d.nextFrame(() => state.buttonRef.current?.focus())
    },
    [dispatch, disabled, d, state.buttonRef]
  )

  const handleClick = React.useCallback(
    (event: { preventDefault: Function }) => {
      if (disabled) return event.preventDefault()
      if (onClick) return onClick(event)
    },
    [disabled, onClick]
  )

  const propsBag = React.useMemo(() => ({ active, disabled }), [active, disabled])

  return (
    <Component
      {...rest}
      id={id}
      role="menuitem"
      tabIndex={-1}
      className={resolvePropValue(className, propsBag)}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={handleClick}
      onFocus={handleFocus}
      onMouseMove={handleMouseMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
    />
  )
}

function resolvePropValue<TProperty, TBag>(property: TProperty, bag: TBag) {
  if (property === undefined) return undefined
  if (typeof property === 'function') return property(bag)
  return property
}

// ---

Menu.Button = Button
Menu.Items = Items
Menu.Item = Item
