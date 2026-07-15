import { Instagram, Youtube, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-ink text-bone">
      <div className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="text-display text-4xl tracking-[0.15em]">
              ALL<span className="text-molten">/</span>STAG
            </div>
            <p className="mt-4 max-w-sm text-sm text-bone/70">
              Heavyweight tees, boxy shirts and racer tanks — cut and stitched in
              Mumbai, shipped everywhere.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center border border-bone/20 hover:border-molten hover:text-molten">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Shop", links: ["New Arrivals", "Tees", "Shirts", "Tanks", "Gift Cards"] },
            { title: "Support", links: ["Track Order", "Shipping", "Returns & Exchange", "Size Guide", "Contact"] },
            { title: "Company", links: ["About", "Journal", "Careers", "Wholesale", "Privacy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-mono uppercase tracking-widest text-molten">{col.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-bone/70">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-bone">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-bone/10 pt-6 text-xs text-bone/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Allstag. All rights reserved.</p>
          <p className="font-mono uppercase tracking-widest">India · INR ₹</p>
        </div>
      </div>
    </footer>
  );
}
