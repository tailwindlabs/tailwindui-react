import * as React from 'react'

let id = 0
function generateId() {
  return ++id
}

export function useId() {
  const [id] = React.useState(generateId)
  return id
}
