import Box from "@mui/material/Box";
import {
  ReactNode,
  RefObject,
  createContext,
  useContext,
  useRef,
  useCallback,
} from "react";

export type ScrollContextType = {
  // The ref points to the scrollable element (div)
  scrollRef: RefObject<HTMLElement | null>;
};

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

// Adds a simple pull-to-refresh handler: when the user touches and pulls down
// while the scroll is at the top and the pulled distance exceeds the
// threshold, we call `window.location.reload()`.
export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const scrollRef = useRef<HTMLElement | null>(null);

  // touch handling refs (we keep them in refs to avoid re-renders)
  const startYRef = useRef<number | null>(null);
  const pulledRef = useRef<boolean>(false);
  const THRESHOLD = 80; // pixels to trigger reload

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only start when at top
    if (el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      pulledRef.current = false;
    } else {
      startYRef.current = null;
      pulledRef.current = false;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const startY = startYRef.current;
    if (startY == null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta > THRESHOLD) {
      pulledRef.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pulledRef.current) {
      // do a reload of the whole app (hard reload)
      window.location.reload();
    }
    startYRef.current = null;
    pulledRef.current = false;
  }, []);

  // Attach native touch listeners to the scroll container via ref callback
  const setRef = useCallback((node: HTMLElement | null) => {
    const prev = scrollRef.current;
    if (prev) {
      prev.removeEventListener("touchstart", onTouchStart);
      prev.removeEventListener("touchmove", onTouchMove);
      prev.removeEventListener("touchend", onTouchEnd);
      prev.removeEventListener("touchcancel", onTouchEnd);
    }
    scrollRef.current = node;
    if (node) {
      node.addEventListener("touchstart", onTouchStart, { passive: true });
      node.addEventListener("touchmove", onTouchMove, { passive: true });
      node.addEventListener("touchend", onTouchEnd);
      node.addEventListener("touchcancel", onTouchEnd);
    }
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return (
    <Box sx={{ flex: "1 1", overflow: "auto" }} ref={setRef as any}>
      <ScrollContext.Provider value={{ scrollRef }}>
        {children}
      </ScrollContext.Provider>
    </Box>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used within an ScrollProvider");
  }
  return context;
};
