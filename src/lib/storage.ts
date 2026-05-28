const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const storage = {
  get<T>(key: string, fallback: T) {
    if (typeof window === "undefined") {
      return fallback;
    }
    return safeParse<T>(localStorage.getItem(key), fallback);
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }
};
