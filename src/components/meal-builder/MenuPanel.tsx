import { useMemo, useState } from "react";
import { Search, Utensils } from "lucide-react";
import { useMenuItems, useCategories } from "@/lib/use-menu-items";
import { DraggableMenuItem } from "./DraggableMenuItem";

function MenuSkeleton() {
  return (
    <div aria-label="Loading menu" aria-busy="true">
      <div className="mb-5 flex gap-2 overflow-hidden">
        {[72, 96, 88, 104].map((w, i) => <div key={i} className="h-9 shrink-0 animate-pulse rounded-full bg-slate-200/80" style={{ width: w }} />)}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200/70">
            <div className="aspect-[1.08/1] animate-pulse bg-slate-200/80 sm:aspect-[4/3]" />
            <div className="space-y-2 p-3.5">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-3 flex items-center justify-between"><div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" /><div className="h-9 w-9 animate-pulse rounded-full bg-slate-200/80" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuPanel({ restaurantId, currency = "NGN" }: { restaurantId: number; currency?: string }) {
  const { items, loading, error } = useMenuItems(restaurantId);
  const { categories, loading: categoriesLoading } = useCategories(restaurantId);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => items.filter((item) => (active === "all" || item.category === active) && (!query || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase()))), [items, active, query]);

  return <section>
    <div className="relative mb-4"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search food, drinks..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none shadow-sm transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></div>
    {(loading || categoriesLoading) ? <MenuSkeleton /> : <>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setActive("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition ${active === "all" ? "bg-slate-950 text-white shadow-lg" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>All</button>
        {categories.map((c) => <button key={c.id} onClick={() => setActive(c.name)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition ${active === c.name ? "bg-slate-950 text-white shadow-lg" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{c.name}</button>)}
      </div>
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">We couldn't load the menu. Please refresh and try again.</p>}
      {!error && visible.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((item) => <DraggableMenuItem key={item.id} item={item} currency={currency} />)}</div>}
      {!error && visible.length === 0 && <div className="py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100"><Utensils className="h-5 w-5 text-slate-400" /></div><p className="mt-3 text-sm font-bold text-slate-700">Nothing matches that yet</p><p className="mt-1 text-xs text-slate-500">Try another category or search.</p></div>}
    </>}
  </section>;
}
