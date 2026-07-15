import { useEffect, useState } from "react";

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

export function Countdown() {
  const target = typeof window !== "undefined"
    ? Number(localStorage.getItem("allstag_sale_end") ??
        (() => {
          const t = Date.now() + 3 * 86_400_000 + 7 * 3_600_000;
          localStorage.setItem("allstag_sale_end", String(t));
          return t;
        })())
    : Date.now() + 3 * 86_400_000;
  const { d, h, m, s } = useCountdown(target);
  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="min-w-16 bg-ink px-3 py-2 text-center text-3xl font-bold text-bone tabular-nums lg:text-4xl">
        {String(v).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-ink/70">{l}</div>
    </div>
  );
  return (
    <div className="border-y border-ink bg-molten py-10 text-bone">
      <div className="mx-auto max-w-[1400px] px-4 text-center lg:px-8">
        <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-bone/80">Birthday Sale · Ends In</div>
        <div className="mt-4 flex items-end justify-center gap-3 text-ink lg:gap-5">
          <Box v={d} l="Days" />
          <div className="pb-6 text-2xl font-bold">:</div>
          <Box v={h} l="Hours" />
          <div className="pb-6 text-2xl font-bold">:</div>
          <Box v={m} l="Mins" />
          <div className="pb-6 text-2xl font-bold">:</div>
          <Box v={s} l="Secs" />
        </div>
      </div>
    </div>
  );
}
