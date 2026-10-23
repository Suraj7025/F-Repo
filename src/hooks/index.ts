// ========================================
// Custom Hooks
// ========================================

import { useState, useEffect, useRef, useCallback } from 'react';

// --- Animated Counter ---
export function useAnimatedCounter(target: number, duration: number = 800): number {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      prevTarget.current = target;
      return;
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return count;
}

// --- Media Query ---
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// --- Is Mobile ---
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

// --- Is Tablet ---
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

// --- Is Desktop ---
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

// --- Toast System ---
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((l) => l([...toasts]));
}

export function showToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  notifyListeners();

  const duration = toast.duration || 4000;
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, duration);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToasts(): Toast[] {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setState(t);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return state;
}

// --- Debounced value ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// --- Click outside ---
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callbackRef.current();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref]);
}

// --- Undo handler ---
export function useUndo<T>(callback: (item: T) => void) {
  const [deletedItem, setDeletedItem] = useState<T | null>(null);

  const performDelete = useCallback(
    (item: T, deleteAction: () => void) => {
      setDeletedItem(item);
      deleteAction();
      showToast({
        message: 'Item deleted',
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            if (deletedItem) {
              callback(deletedItem as T);
            }
            setDeletedItem(null);
          },
        },
        duration: 5000,
      });
    },
    [callback, deletedItem]
  );

  return { performDelete };
}
