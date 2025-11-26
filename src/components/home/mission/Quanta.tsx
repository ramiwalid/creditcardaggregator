// src/components/fun/CursorHead.tsx
"use client";

import React, { useEffect, useRef, useState, CSSProperties } from "react";

type Point = { x: number; y: number };

export const Quanta: React.FC = () => {
  const leftEyeRef = useRef<HTMLDivElement | null>(null);
  const rightEyeRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const getPupilStyle = (
    eyeRef: React.RefObject<HTMLDivElement>
  ): CSSProperties => {
    if (!cursorPos || !eyeRef.current) {
      return { transform: "translate(-50%, -50%)" };
    }

    const eyeRect = eyeRef.current.getBoundingClientRect();
    const eyeCenter: Point = {
      x: eyeRect.left + eyeRect.width / 2,
      y: eyeRect.top + eyeRect.height / 2,
    };

    const dx = cursorPos.x - eyeCenter.x;
    const dy = cursorPos.y - eyeCenter.y;

    const angle = Math.atan2(dy, dx);
    const maxOffset = 6; 

    const offsetX = Math.cos(angle) * maxOffset;
    const offsetY = Math.sin(angle) * maxOffset;

    return {
      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
      transition: "transform 50ms linear",
    };
  };

  return (
    <div className="relative flex items-center justify-center">
      <div className="pointer-events-none absolute h-40 w-72 rounded-[32px] bg-[radial-gradient(circle_at_center,#A259FF33,#0A0F1F_60%)] blur-2xl" />

      <div className="relative h-40 w-72 rounded-[28px] bg-gradient-to-br from-[#11152A] via-[#151A30] to-[#1F1440] border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-card-bob">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-8 rounded-md bg-gradient-to-br from-[#FF2E9A] to-[#3A86FF] opacity-80" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
              Quanta
            </span>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/60">
            Friendly insights
          </span>
        </div>

        <div className="mt-5 flex items-center justify-center gap-6 px-5">
          <div className="h-3 w-3 rounded-full bg-[#FF2E9A33]" />

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-5">
              <div
                ref={leftEyeRef}
                className="relative h-8 w-8 rounded-full bg-white/95 shadow-inner border border-[#FF2E9A22]"
              >
                <div
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[#0A0F1F]"
                  style={getPupilStyle(leftEyeRef)}
                >
                  <div className="absolute left-1 top-0.5 h-1.5 w-1.5 rounded-full bg-white/85" />
                </div>
                <div className="pointer-events-none absolute inset-x-1 top-0 h-2 rounded-t-full bg-[#11152A] opacity-15" />
              </div>

              <div
                ref={rightEyeRef}
                className="relative h-8 w-8 rounded-full bg-white/95 shadow-inner border border-[#FF2E9A22]"
              >
                <div
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[#0A0F1F]"
                  style={getPupilStyle(rightEyeRef)}
                >
                  <div className="absolute left-1 top-0.5 h-1.5 w-1.5 rounded-full bg-white/85" />
                </div>
                <div className="pointer-events-none absolute inset-x-1 top-0 h-2 rounded-t-full bg-[#11152A] opacity-15" />
              </div>
            </div>

            <div className="mt-1 h-3 w-10 rounded-b-full border-b-2 border-[#FF2E9A99]" />
          </div>

          <div className="h-3 w-3 rounded-full bg-[#FF2E9A33]" />
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-5 text-[10px] text-white/45">
          <span className="tracking-[0.18em] uppercase">
            Utilization · 23%
          </span>
          <span className="rounded-full bg-white/5 px-2 py-1 text-[9px]">
            Watching your spend 👀
          </span>
        </div>
      </div>
    </div>
  );
};
