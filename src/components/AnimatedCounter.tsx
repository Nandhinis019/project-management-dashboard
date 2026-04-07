import { animate } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const c = animate(0, value, {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => c.stop();
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}
