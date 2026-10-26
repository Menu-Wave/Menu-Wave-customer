import { motion } from "framer-motion";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { useEffect } from "react";
import { MenuPanel } from "./MenuPanel";
import { CheckoutBar } from "./CheckoutBar";
import { Favourites } from "./Favourites";
import { useCart } from "@/lib/cart-store";
import { type Restaurant } from "@/lib/supabase";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "R";
}

export function MealBuilder({ restaurant }: { restaurant: Restaurant }) {
  const setTable = useCart((s) => s.setTableNumber);
  const table = useCart((s) => s.tableNumber);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("table");
    if (q && /^\d+$/.test(q)) {
      const n = Number(q);
      if (n >= 1 && n <= restaurant.table_count) setTable(q);
    }
  }, [restaurant.table_count, setTable]);

  return (
    <div className="mw-customer min-h-screen bg-[#FBFAF7] pb-28 text-slate-950">
      <header className="mw-restaurant-header sticky top-0 z-30 border-b border-slate-200/70 bg-[#FBFAF7]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={`${restaurant.name} logo`} className="h-11 w-11 rounded-2xl bg-white object-contain p-1 shadow-sm ring-1 ring-slate-200" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">{initials(restaurant.name)}</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-black">{restaurant.name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3" />{table ? `Table ${table} · Dine in` : "Dine in · Scan your table QR"}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-extrabold text-slate-600 ring-1 ring-slate-200 sm:flex">
            <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" /> Fresh menu
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:pt-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-black uppercase tracking-[.16em] text-orange-500">Order straight from your table</p>
          <p className="mt-2 text-sm font-extrabold text-slate-700">Good day 👋</p>
          <h2 className="mt-1 max-w-xl text-[30px] font-black leading-[1.05] tracking-[-.035em] sm:text-4xl">What are you craving?</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Pick your favourites, review your cart, and send your order to the restaurant.</p>
        </motion.div>

        <div className="mt-5"><Favourites restaurantId={restaurant.id} /></div>
        <div className="mt-5"><MenuPanel restaurantId={restaurant.id} currency={restaurant.currency} /></div>
      </main>

      <footer className="px-4 pb-6 pt-12 text-center text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
        Powered by <span className="text-slate-600">Menu-Wave</span>
      </footer>
      <CheckoutBar restaurant={restaurant} />
    </div>
  );
}
