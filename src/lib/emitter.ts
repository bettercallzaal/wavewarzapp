export type Listener<T> = (value: T) => void;
export type Unsubscribe = () => void;

export interface Emitter<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: Listener<T>): Unsubscribe;
}

export const createEmitter = <T>(initial: T): Emitter<T> => {
  let value = initial;
  const listeners = new Set<Listener<T>>();

  return {
    get: () => value,
    set: (next) => {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      listeners.forEach((l) => l(value));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(value);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
