import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu-data";
import { formatCurrency } from "@/lib/supabase";

export function DraggableMenuItem({ item, currency = "NGN" }: { item: MenuItem; currency?: string }) {
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const entries = useCart((s) => s.entries);
  const matching = entries.filter((entry) => entry.item.id === item.id);
  const quantity = matching.length;

  const addOne = () => add(item, 0, 0);
  const removeOne = () => {
    const last = matching[matching.length - 1];
    if (last) remove(last.uid);
  };

  return (
    <motion.article layout whileTap={{ scale: 0.99 }} className="group overflow-hidden rounded-[22px] bg-white shadow-[0_8px_30px_rgba(15,23,42,.07)] ring-1 ring-slate-200/70">
      <div className="relative aspect-[1.08/1] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 sm:aspect-[4/3]">
        {item.image ? (
          <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-6xl">{item.emoji}</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {item.isPopular && <span className="rounded-full bg-slate-950/88 px-2.5 py-1 text-[9px] font-extrabold text-white backdrop-blur">🔥 Popular</span>}
          {item.isNew && <span className="rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-extrabold text-slate-900 backdrop-blur">✨ New</span>}
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-1 text-[15px] font-extrabold leading-5 text-slate-950">{item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-[18px] text-slate-500">{item.description}</p>}
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-black text-slate-950">{formatCurrency(item.price, currency)}</p>
          {quantity === 0 ? (
            <button onClick={addOne} aria-label={`Add ${item.name} to cart`} className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-90">
              <Plus className="h-4 w-4" strokeWidth={3} />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-slate-950 p-1 text-white shadow-lg">
              <button onClick={removeOne} aria-label={`Remove one ${item.name}`} className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/10"><Minus className="h-3.5 w-3.5" /></button>
              <span className="min-w-5 text-center text-xs font-black">{quantity}</span>
              <button onClick={addOne} aria-label={`Add another ${item.name}`} className="grid h-7 w-7 place-items-center rounded-full bg-blue-600"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
