const planStyles = {
  FREE: "bg-slate-200 text-slate-700",
  BASIC: "bg-mint/20 text-ocean",
  PRO: "bg-coral/20 text-orange-800",
  ENTERPRISE: "bg-ink text-white"
};

export default function PlanBadge({ planName }) {
  const normalizedPlan = String(planName || "FREE").toUpperCase();
  const badgeStyle = planStyles[normalizedPlan] || "bg-white text-ink";

  return (
    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}>
      Plan {normalizedPlan}
    </div>
  );
}
