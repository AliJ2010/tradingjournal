"use client";

import { useEffect, useRef } from "react";

export default function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let visible = false;

    function onMove(e: MouseEvent) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.setProperty("--x", `${e.clientX}px`);
          ref.current.style.setProperty("--y", `${e.clientY}px`);
          if (!visible) {
            ref.current.style.opacity = "1";
            visible = true;
          }
        }
        frame = 0;
      });
    }

    function onLeave() {
      if (ref.current) ref.current.style.opacity = "0";
      visible = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-0 z-40 pointer-events-none opacity-0 transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(390px circle at var(--x, 50%) var(--y, 50%), rgba(124,92,255,0.16), rgba(34,211,238,0.06) 45%, transparent 70%)",
      }}
    />
  );
}
