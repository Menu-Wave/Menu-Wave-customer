import { Check, ChefHat, Clock3, CircleCheckBig } from "lucide-react";

type OrderStage = "new" | "preparing" | "ready" | "done";

const steps: { key: OrderStage; label: string; detail: string }[] = [
  { key: "new", label: "Order received", detail: "Your order has reached the restaurant." },
  { key: "preparing", label: "Preparing", detail: "The kitchen is preparing your meal." },
  { key: "ready", label: "Ready", detail: "Your meal is ready for collection or service." },
  { key: "done", label: "Completed", detail: "Your order has been completed." },
];

const rank: Record<OrderStage, number> = { new: 0, preparing: 1, ready: 2, done: 3 };

export function OrderTimeline({ status }: { status: OrderStage }) {
  const current = rank[status];
  return (
    <div className="mt-6 w-full text-left" aria-live="polite">
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <div key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 && (
              <span className={`absolute left-[15px] top-8 h-[calc(100%-1.1rem)] w-0.5 ${index < current ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
            <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${complete || active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-300"}`}>
              {complete ? <Check className="h-4 w-4" /> : active && step.key === "preparing" ? <ChefHat className="h-4 w-4" /> : active && step.key === "ready" ? <Clock3 className="h-4 w-4" /> : active && step.key === "done" ? <CircleCheckBig className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-extrabold ${active ? "text-blue-700" : complete ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
              <p className={`mt-0.5 text-xs leading-5 ${active || complete ? "text-slate-500" : "text-slate-400"}`}>{step.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
