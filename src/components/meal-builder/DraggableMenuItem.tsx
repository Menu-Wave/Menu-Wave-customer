import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu-data";
import { formatCurrency } from "@/lib/supabase";

export function DraggableMenuItem({ item, currency = "NGN" }: { item: MenuItem; currency?: string }) {
  const add = useCart((s) => s.add);
  const entries = useCart((s) => s.entries);

  const handleAdd = () => {
    const index = entries.length;
    const col = index % 4;
    const row = Math.floor(index / 4) % 4;
    const x = 16 + col * 84 + (row % 2) * 20;
    const y = 16 + row * 84;
    add(item, x, y);
  };

  return (
    <button
      onClick={handleAdd}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md active:scale-[0.98]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-2xl">
        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : item.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{item.name}</span>
        <span className="mt-1 block text-xs font-extrabold text-primary">{formatCurrency(item.price, currency)}</span>
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105 group-hover:bg-blue-700">
        <Plus className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}
