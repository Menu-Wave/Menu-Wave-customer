import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { resolveRestaurant, type Restaurant } from "@/lib/supabase";
import { MealBuilder } from "@/components/meal-builder/MealBuilder";

export const Route = createFileRoute("/$slug")({ component: RestaurantPage });

function RestaurantLoadingSkeleton() {
  return <div className="min-h-screen bg-[#FBFAF7]" aria-label="Loading restaurant" aria-busy="true">
    <div className="border-b border-slate-200/70 bg-[#FBFAF7]"><div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3"><div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" /><div className="flex-1 space-y-2"><div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" /><div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" /></div></div></div>
    <main className="mx-auto max-w-5xl px-4 pt-6"><div className="h-3 w-36 animate-pulse rounded-full bg-orange-100" /><div className="mt-3 h-8 w-72 max-w-[80%] animate-pulse rounded-xl bg-slate-200" /><div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-slate-100" /><div className="mt-7 h-12 w-full animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" /><div className="mt-5 flex gap-2">{[72,92,84,100].map((w,i)=><div key={i} className="h-9 animate-pulse rounded-full bg-slate-200" style={{width:w}} />)}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200/70"><div className="aspect-[1.08/1] animate-pulse bg-slate-200" /><div className="space-y-2 p-3.5"><div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200"/><div className="h-3 w-full animate-pulse rounded-full bg-slate-100"/><div className="h-4 w-20 animate-pulse rounded-full bg-slate-200"/></div></div>)}</div></main>
  </div>;
}

function RestaurantPage() {
  const { slug } = Route.useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false);
    (async () => {
      const r = await resolveRestaurant(slug);
      if (cancelled) return;
      if (!r) setNotFound(true); else setRestaurant(r);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <RestaurantLoadingSkeleton />;
  if (notFound || !restaurant) return <div className="grid h-screen place-items-center bg-[#FBFAF7] px-4 text-center"><div><h1 className="text-2xl font-bold text-slate-950">Restaurant not found</h1><p className="mt-2 text-sm text-slate-500">We couldn't find a restaurant at this link. Please check the QR code or link and try again.</p></div></div>;
  return <MealBuilder restaurant={restaurant} />;
}
