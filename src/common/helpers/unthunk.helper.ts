import { Thunk } from "graphql";


export function unthunk<T>(mbThunk: Thunk<T>): T {
  if (typeof mbThunk === 'function') return (mbThunk as () => T)();
  return mbThunk;
}