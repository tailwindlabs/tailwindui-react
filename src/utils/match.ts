export function match<TValue extends string | number = string, TReturnValue = unknown>(
  value: TValue,
  lookup: Record<TValue, TReturnValue | (() => TReturnValue)>
): TReturnValue {
  if (value in lookup) {
    const returnValue = lookup[value]
    return typeof returnValue === 'function' ? returnValue() : returnValue
  }

  const error = new Error(
    `Tried to handle "${value}" but there is no handler defined. Only defined handlers are: ${Object.keys(
      lookup
    )
      .map(key => `"${key}"`)
      .join(', ')}.`
  )

  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, match)
  }

  throw error
}
