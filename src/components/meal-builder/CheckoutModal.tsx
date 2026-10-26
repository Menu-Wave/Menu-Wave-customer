import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { formatCurrency, type Restaurant } from "@/lib/supabase";
import { OrderTimeline } from "./OrderTimeline";

const SUPABASE_ANON_KEY = "sb_publishable_6bs0IPax7ctABcDJrcWW5w_3PHfgfvk";
const CHECKOUT_URL = "https://wxlhhisfexcltjpvcljo.supabase.co/functions/v1/checkout";
const TRACK_ORDER_URL = "https://wxlhhisfexcltjpvcljo.supabase.co/functions/v1/track-order";

type OrderStage = "new" | "preparing" | "ready" | "done";

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0) throw new Error(`status ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export function CheckoutModal({
  open,
  onClose,
  restaurant,
}: {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}) {
  const entries = useCart((s) => s.entries);
  const name = useCart((s) => s.name);
  const tableNumber = useCart((s) => s.tableNumber);
  const clear = useCart((s) => s.clear);
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStage>("new");
  const [connected, setConnected] = useState(true);
  const total = cartTotal(entries);
  const tableNum = Number(tableNumber);

  const grouped = entries.reduce<Record<number, { id: number; name: string; emoji: string; price: number; qty: number }>>(
    (acc, e) => {
      const k = e.item.id;
      if (!acc[k]) acc[k] = { id: e.item.id, name: e.item.name, emoji: e.item.emoji, price: e.item.price, qty: 0 };
      acc[k].qty += 1;
      return acc;
    },
    {},
  );

  useEffect(() => {
    if (!trackingToken) return;

    let active = true;
    let inFlight = false;

    const checkStatus = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const response = await fetch(TRACK_ORDER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token: trackingToken }),
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setConnected(false);
          return;
        }

        const result = await response.json();
        const nextStatus = String(result?.status ?? "").toLowerCase();

        if (!active) return;
        if (["new", "preparing", "ready", "done"].includes(nextStatus)) {
          setStatus(nextStatus as OrderStage);
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        if (active) setConnected(false);
      } finally {
        inFlight = false;
      }
    };

    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [trackingToken]);

  const handlePlace = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > restaurant.table_count) {
      setError(`Please check your table number and try again. Valid table numbers are 1–${restaurant.table_count}.`);
      setSubmitting(false);
      return;
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    // The server is authoritative for names and prices. The browser only sends
    // stable menu item IDs and quantities.
    const order = Object.values(grouped).map((g) => ({
      menuItemId: g.id,
      quantity: g.qty,
    }));

    try {
      const response = await fetchWithRetry(CHECKOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          orderNumber,
          name,
          table_number: tableNum,
          order,
          placedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed with status ${response.status}`);
      }

      const orderRow = await response.json();
      if (typeof orderRow?.trackingToken !== "string" || !orderRow.trackingToken) {
        throw new Error("Checkout response did not include a tracking token");
      }
      setTrackingToken(orderRow.trackingToken);
      if (orderRow?.public_code) setOrderCode(orderRow.public_code);
      setConnected(true);

      setPlaced(true);
      setStatus("new");
    } catch (err) {
      console.error("Checkout failed", err);
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAfterDone = () => {
    clear();
    setPlaced(false);
    setTrackingToken(null);
    setOrderCode(null);
    setStatus("new");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={placed ? undefined : onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            {placed ? (
              <div className="px-6 py-7">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Live order status</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-foreground">Your order</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Table {tableNum}{orderCode ? ` · ${orderCode}` : ""}
                  </p>
                </div>
                <OrderTimeline status={status} />
                {status === "new" && (
                  <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
                    Please proceed to the counter for payment to confirm your order.
                  </p>
                )}
                {status === "ready" && (
                  <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
                    Your meal is ready. Please follow the restaurant's collection/service instructions.
                  </p>
                )}
                {status === "done" && (
                  <button onClick={handleCloseAfterDone} className="mt-5 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
                    Back to menu
                  </button>
                )}
                {!connected && (
                  <p className="mt-3 text-center text-xs text-amber-600">Trying to reconnect… your last confirmed status is still shown above.</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h3 className="text-lg font-bold text-foreground">Order Summary</h3>
                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 py-4">
                  {Object.values(grouped).map((g) => (
                    <div key={g.name} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(g.price, restaurant.currency)} × {g.qty}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(g.price * g.qty, restaurant.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-6 py-4">
                  <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                    <span>Customer</span>
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl font-extrabold text-foreground">
                      {formatCurrency(total, restaurant.currency)}
                    </span>
                  </div>
                </div>
                {error && (
                  <div className="mx-6 mb-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <div className="px-6 pb-6">
                  <button
                    onClick={handlePlace}
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
