import { createContext, useContext } from 'react';

export const EventTreeContext = createContext(null);
export const EventTreeShowEmptyBranchContext = createContext(null)
export const EventTreeDispatchContext = createContext(null);

export function useEventTree() {
  return useContext(EventTreeContext);
}

export function useEventTreeDispatch() {
  return useContext(EventTreeDispatchContext);
}

export function useEventTreeShowEmptyBranchContext() {
  return useContext(EventTreeShowEmptyBranchContext);
}
