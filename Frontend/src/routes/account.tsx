import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Package, MapPin, LogOut, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — Allstag" },
      { name: "description", content: "Manage your profile, saved addresses and past orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

const EMPTY: Profile = { name: "", email: "", phone: "", address: "", city: "", pincode: "" };
const KEY = "allstag_profile_v1";
const AUTH_KEY = "allstag_auth_v1";

export function AccountPage() {
  const { count } = useCart();
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setSignedIn(localStorage.getItem(AUTH_KEY) === "1");
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  const save = () => {
    const isNew = localStorage.getItem(AUTH_KEY) !== "1";
    localStorage.setItem(KEY, JSON.stringify(profile));
    localStorage.setItem(AUTH_KEY, "1");
    setSignedIn(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    // Fire-and-forget event — welcome email on signup, CRM sync on update.
    import("@/lib/events.functions").then(({ emitEvent }) =>
      emitEvent({
        data: {
          topic: "allstag.users.v1",
          type: isNew ? "user.signed_up" : "user.updated",
          key: profile.email || "anon",
          data: { userId: profile.email, email: profile.email, name: profile.name },
        },
      }),
    ).catch((e) => console.warn("[users:emit-failed]", e));
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setSignedIn(false);
  };

  if (!hydrated) return null;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 lg:py-24">
        <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">Members Only</div>
        <h1 className="mt-2 text-display text-5xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save addresses, track orders, and check out in one tap.
        </p>

        <div className="mt-8 space-y-4">
          <Field label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Aarav Mehta" />
          <Field label="Email" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} placeholder="you@allstag.co" />
          <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile" />
          <button
            onClick={save}
            disabled={!profile.name || !profile.email}
            className="w-full bg-molten py-4 text-sm font-bold uppercase tracking-widest text-bone hover:bg-molten-deep disabled:opacity-40"
          >
            Continue
          </button>
          <p className="text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            By continuing you agree to our terms &amp; privacy
          </p>
        </div>
      </div>
    );
  }

  const initials = profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "AS";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="flex items-end justify-between border-b border-ink/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center bg-ink text-display text-xl text-bone">
            {initials}
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.4em] text-molten">Welcome back</div>
            <h1 className="mt-1 text-display text-4xl lg:text-5xl">{profile.name || "Friend"}</h1>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 border border-ink/20 px-4 py-2 text-xs font-mono uppercase tracking-widest hover:border-molten hover:text-molten"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        {/* Sidebar */}
        <aside className="space-y-3">
          <SideCard icon={Package} title="Orders" value="0 in progress" href="#orders" />
          <Link to="/cart" className="block">
            <SideCard icon={Heart} title="Your Bag" value={`${count} item${count === 1 ? "" : "s"}`} />
          </Link>
          <SideCard icon={MapPin} title="Address" value={profile.city ? `${profile.city} · ${profile.pincode}` : "Not saved yet"} />
          <SideCard icon={User} title="Contact" value={profile.email} />
        </aside>

        {/* Profile edit */}
        <section className="border border-ink/10 bg-card p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-molten">Profile &amp; Shipping</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
            <Field label="Email" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v.replace(/\D/g, "").slice(0, 10) })} />
            <Field label="Pincode" value={profile.pincode} onChange={(v) => setProfile({ ...profile, pincode: v.replace(/\D/g, "").slice(0, 6) })} />
            <div className="md:col-span-2">
              <Field label="Address" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} placeholder="House / street / area" />
            </div>
            <Field label="City" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={save}
              className="bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten"
            >
              Save changes
            </button>
            {saved && <span className="text-xs font-mono uppercase tracking-widest text-molten">✦ Saved</span>}
          </div>
        </section>
      </div>

      {/* Orders */}
      <section id="orders" className="mt-14 border-t border-ink/10 pt-10">
        <h2 className="text-xs font-mono uppercase tracking-widest text-molten">Recent Orders</h2>
        <div className="mt-6 border border-dashed border-ink/20 p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No orders yet — your first fit awaits.</p>
          <Link
            to="/collections/$handle"
            params={{ handle: "shop-all" }}
            className="mt-4 inline-block bg-molten px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten-deep"
          >
            Start shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ink/20 bg-transparent px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function SideCard({
  icon: Icon, title, value, href,
}: { icon: typeof User; title: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 border border-ink/10 bg-card p-4 hover:border-molten">
      <div className="grid h-10 w-10 place-items-center bg-ink text-bone">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{title}</div>
        <div className="text-sm font-semibold">{value || "—"}</div>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
