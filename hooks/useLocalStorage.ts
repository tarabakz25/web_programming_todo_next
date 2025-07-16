import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, init: T) {
  const [value, setValue] = useState<T>(init);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [key])

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, value, isHydrated]);

  return [value, setValue] as const;
}