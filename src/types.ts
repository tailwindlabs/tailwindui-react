export type PropsOf<TTag = any> = TTag extends React.ElementType
  ? React.ComponentProps<TTag>
  : never

export type AsShortcut<TTag> = { as?: TTag } & PropsOf<TTag>
