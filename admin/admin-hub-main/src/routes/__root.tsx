import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { MarqueeBar } from "@/components/site/MarqueeBar";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartProvider } from "@/context/CartContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-display text-8xl text-molten">404</div>
        <h2 className="mt-4 text-2xl">Flame's out</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page is either sold out or never existed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-4xl">Something snapped</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again, or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-molten"
          >
            Try again
          </button>
          <a href="/" className="border border-ink px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-bone">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Allstag — Heavyweight Streetwear from Mumbai" },
      { name: "description", content: "Heavyweight tees, boxy shirts and racer tanks. Cut and stitched in Mumbai. Free shipping over ₹999." },
      { name: "author", content: "Allstag" },
      { property: "og:title", content: "Allstag — Heavyweight Streetwear" },
      { property: "og:description", content: "Stitched in Mumbai. Cut heavy. Shipped everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {isAdmin ? (
          <Outlet />
        ) : (
          <>
            <MarqueeBar />
            <Header />
            <main>
              <Outlet />
            </main>
            <Footer />
          </>
        )}
      </CartProvider>
    </QueryClientProvider>
  );
}
