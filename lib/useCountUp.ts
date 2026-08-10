"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export function useCountUp(target: number, duration = 0.7) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const from = first.current ? 0 : prevTarget.current;
    first.current = false;
    prevTarget.current = target;
    const controls = animate(from, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setValue,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
