const ITEMS = [
  "FREE SHIPPING OVER ₹999",
  "24H DISPATCH",
  "40,000+ ORDERS SHIPPED",
  "COD AVAILABLE PAN-INDIA",
  "EASY 7-DAY EXCHANGE",
  "STITCHED IN MUMBAI",
];

export function MarqueeBar() {
  const doubled = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="bg-ink text-bone overflow-hidden border-b border-ink">
      <div className="flex animate-marquee whitespace-nowrap py-2 text-xs font-mono uppercase tracking-widest">
        {doubled.map((t, i) => (
          <span key={i} className="mx-8 flex items-center gap-8">
            <span>{t}</span>
            <span className="text-molten">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
