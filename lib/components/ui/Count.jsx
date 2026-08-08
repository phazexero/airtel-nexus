'use client';

import { useEffect, useRef, useState } from 'react';

// Numbers that land rather than appear. Short enough that it reads as
// responsiveness, not as an animation you have to wait through.

export default function Count({ to, duration = 620, format = (n) => n.toLocaleString('en-IN'), prefix = '', suffix = '' }) {
  const [n, setN] = useState(0);
  const raf = useRef();

  useEffect(() => {
    // Feature-detected rather than assumed: matchMedia is missing in some
    // webviews and in any non-browser render, and an unguarded call here would
    // take the whole card down with it.
    let reduce = false;
    try {
      reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduce = false;
    }
    if (reduce) {
      setN(to);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(to * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);

  return (
    <>
      {prefix}
      {format(Math.round(n))}
      {suffix}
    </>
  );
}
