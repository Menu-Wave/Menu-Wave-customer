import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { MenuPanel } from "./MenuPanel";
import { DropZone, ITEM_SIZE } from "./DropZone";
import { CheckoutBar } from "./CheckoutBar";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu-data";
import { formatCurrency, type Restaurant } from "@/lib/supabase";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "R";
}

export function MealBuilder({ restaurant }: { restaurant: Restaurant }) {
  const move = useCart((s) => s.move);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const entries = useCart((s) => s.entries);
  const [active, setActive] = useState<MenuItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const onStart = (e: DragStartEvent) => {
    const item = e.active.data.current?.item as MenuItem | undefined;
    if (item) setActive(item);
  };

  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    if (typeof e.active.id !== "string" || !e.active.id.startsWith("tray-")) return;
    const uid = e.active.data.current?.uid as string | undefined;
    if (!uid) return;
    const entry = entries.find((x) => x.uid === uid);
    if (!entry) return;

    if (Math.abs(e.delta.x) > 110 && Math.abs(e.delta.y) < 60) {
      const idx = entries.findIndex((x) => x.uid === uid);
      remove(uid);
      toast(`${entry.item.name} removed`, {
        description: formatCurrency(entry.item.price, restaurant.currency),
        action: { label: "Undo", onClick: () => restore(entry, idx) },
        duration: 4000,
      });
      return;
    }

    const overRect = e.over?.rect;
    const newX = entry.x + e.delta.x;
    const newY = entry.y + e.delta.y;
    if (overRect) {
      const maxX = overRect.width - ITEM_SIZE - 8;
      const maxY = overRect.height - ITEM_SIZE - 8;
      move(uid, Math.max(8, Math.min(newX, maxX)), Math.max(8, Math.min(newY, maxY)));
    } else {
      move(uid, newX, newY);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <div className="mw-customer flex min-h-screen flex-col bg-background">
        <header className="mw-restaurant-header sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:py-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="h-11 w-11 shrink-0 rounded-xl border border-border bg-white object-contain p-1.5 shadow-sm sm:h-12 sm:w-12"
              />
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-sm font-black text-white shadow-sm sm:h-12 sm:w-12">
                {initials(restaurant.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Order from</p>
              <h1 className="truncate text-base font-black leading-tight text-foreground sm:text-lg">{restaurant.name}</h1>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">Build your meal and order from your table</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm sm:flex">
              <ShoppingBag className="h-4 w-4 text-primary" />
              {entries.length} item{entries.length === 1 ? "" : "s"}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
          <div className="mb-4 sm:mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Your order</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">What would you like today?</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tap a menu item to add it to your tray. You can arrange or remove items before checkout.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100vh-270px)] lg:min-h-[560px] lg:grid-cols-[minmax(300px,32%)_1fr] lg:gap-5">
            <div className="order-1 min-h-[340px] lg:order-1 lg:h-auto">
              <MenuPanel restaurantId={restaurant.id} currency={restaurant.currency} />
            </div>
            <div className="order-2 h-[46vh] min-h-[340px] lg:order-2 lg:h-auto">
              <DropZone currency={restaurant.currency} />
            </div>
          </div>
        </main>

        <CheckoutBar restaurant={restaurant} />
        <footer className="border-t border-border/70 bg-slate-50 px-4 py-5 text-center text-[11px] font-semibold text-slate-400">
          Powered by <span className="font-black text-slate-600">Menu-Wave</span>
        </footer>
      </div>

      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="grid h-[72px] w-[72px] cursor-grabbing place-items-center overflow-hidden rounded-2xl bg-white text-4xl shadow-2xl ring-1 ring-black/10">
            {active.image ? <img src={active.image} alt="" className="h-full w-full object-cover" /> : <span>{active.emoji}</span>}
            <span className="sr-only">{active.name} {formatCurrency(active.price, restaurant.currency)}</span>
          </div>
        )}
      </DragOverlay>
      <Toaster position="bottom-center" richColors closeButton />
    </DndContext>
  );
}
