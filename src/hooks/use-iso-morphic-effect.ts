import * as React from 'react'

export const useIsoMorphicEffect =
  typeof window !== 'function' ? React.useLayoutEffect : React.useEffect
