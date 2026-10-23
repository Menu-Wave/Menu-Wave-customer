import { useMemo, useState } from "react";
import { ChevronDown, UtensilsCrossed } from "lucide-react";
import { type MenuItem } from "@/lib/menu-data";
import { useMenuItems, useCategories } from "@/lib/use-menu-items";
import { DraggableMenuItem } from "./DraggableMenuItem";

export function MenuPanel({ restaurantId, currency = "NGN" }: { restaurantId: number; currency?: string }) {
  const { items, loading, error } = useMenuItems(restaurantId);
  const { categories, loading: categoriesLoading } = useCategories(restaurantId);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const c of categories) map[c.name] = items.filter((m) => m.category === c.name);
    return map;
  }, [items, categories]);

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-primary">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">Menu</h2>
          <p className="text-xs text-muted-foreground">Tap + to add an item</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {(loading || categoriesLoading) && <p className="px-2 py-3 text-xs text-muted-foreground">Loading menu…</p>}
        {error && <p className="px-2 py-3 text-xs text-destructive">Failed to load menu: {error}</p>}
        {!loading && !categoriesLoading && categories.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">No menu categories yet — check back soon.</p>
        )}
        {categories.map((cat, idx) => {
          const isOpen = open[cat.name] ?? idx === 0;
          return (
            <div key={cat.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80">
              <button
                onClick={() => setOpen((s) => ({ ...s, [cat.name]: !isOpen }))}
                className="flex w-full items-center gap-2 px-3.5 py-3 text-left text-sm font-bold text-foreground transition hover:bg-slate-100"
              >
                <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm">{grouped[cat.name]?.length ?? 0}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-slate-100 p-2">
                  {(grouped[cat.name] ?? []).map((item) => <DraggableMenuItem key={item.id} item={item} currency={currency} />)}
                  {(grouped[cat.name] ?? []).length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No items in this category yet.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
