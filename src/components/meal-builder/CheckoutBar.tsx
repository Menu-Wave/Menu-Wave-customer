import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { CheckoutModal } from "./CheckoutModal";
import { formatCurrency, type Restaurant } from "@/lib/supabase";

export function validateTableNumber(raw: string, max: number) {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
}

export function CheckoutBar({ restaurant }: { restaurant: Restaurant }) {
  const name = useCart((s) => s.name), setName = useCart((s) => s.setName);
  const table = useCart((s) => s.tableNumber), setTable = useCart((s) => s.setTableNumber);
  const entries = useCart((s) => s.entries), add = useCart((s) => s.add), remove = useCart((s) => s.remove), clear = useCart((s) => s.clear);
  const [review, setReview] = useState(false), [checkout, setCheckout] = useState(false), [error, setError] = useState<string | null>(null);
  const total = cartTotal(entries);
  const grouped = useMemo(() => {
    const map = new Map<number, { item: (typeof entries)[number]["item"]; entries: typeof entries }>();
    for (const entry of entries) {
      const group = map.get(entry.item.id) ?? { item: entry.item, entries: [] };
      group.entries.push(entry); map.set(entry.item.id, group);
    }
    return [...map.values()];
  }, [entries]);

  const continueOrder = () => {
    if (!name.trim()) return setError("Tell us the name we should call when your meal is ready.");
    if (validateTableNumber(table, restaurant.table_count) === null) return setError(`Check your table number (1–${restaurant.table_count}).`);
    setError(null); setReview(false); setCheckout(true);
  };

  return <>
    {entries.length > 0 && <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
      <button onClick={() => setReview(true)} className="mx-auto flex w-full max-w-lg items-center gap-3 rounded-[20px] bg-slate-950 px-3.5 py-3 text-left text-white shadow-[0_18px_50px_rgba(15,23,42,.30)] ring-1 ring-white/10">
        <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10"><ShoppingBag className="h-5 w-5"/><span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black">{entries.length}</span></span>
        <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wider text-white/55">Your order</span><span className="block text-base font-black">{formatCurrency(total, restaurant.currency)}</span></span>
        <span className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black">View order</span>
      </button>
    </div>}

    <AnimatePresence>{review && <motion.div className="fixed inset-0 z-50 flex items-end bg-slate-950/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReview(false)}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-[#FBFAF7] p-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-orange-500">Your order</p><h3 className="mt-1 text-2xl font-black">Almost ready</h3></div><button onClick={() => setReview(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200"><X className="h-4 w-4"/></button></div>

          <div className="space-y-2.5">{grouped.map((group) => <div key={group.item.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/70">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-orange-50">{group.item.image ? <img src={group.item.image} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-2xl">{group.item.emoji}</div>}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{group.item.name}</p><p className="mt-0.5 text-xs font-bold text-slate-500">{formatCurrency(group.item.price * group.entries.length, restaurant.currency)}</p></div>
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1"><button onClick={() => remove(group.entries[group.entries.length - 1].uid)} className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm"><Minus className="h-3.5 w-3.5"/></button><span className="min-w-5 text-center text-xs font-black">{group.entries.length}</span><button onClick={() => add(group.item, 0, 0)} className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white"><Plus className="h-3.5 w-3.5"/></button></div>
          </div>)}</div>

          <div className="my-5 flex items-center justify-between border-y border-slate-200 py-4"><button onClick={clear} className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Trash2 className="h-3.5 w-3.5"/>Clear order</button><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p><p className="text-xl font-black">{formatCurrency(total, restaurant.currency)}</p></div></div>

          <label className="text-xs font-extrabold text-slate-600">Your name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
          <div className="mt-4 flex items-end justify-between"><label className="text-xs font-extrabold text-slate-600">Table number</label>{table && <span className="text-[10px] font-bold text-green-600">Table selected</span>}</div>
          <input value={table} onChange={(e) => setTable(e.target.value)} inputMode="numeric" placeholder={`1–${restaurant.table_count}`} className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
          {error && <p className="mt-3 text-xs font-bold text-red-600">{error}</p>}
          <button onClick={continueOrder} disabled={!entries.length} className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition active:scale-[.99] disabled:opacity-50">Review & place order →</button>
        </div>
      </motion.div>
    </motion.div>}</AnimatePresence>
    <CheckoutModal open={checkout} onClose={() => setCheckout(false)} restaurant={restaurant}/>
  </>;
}
