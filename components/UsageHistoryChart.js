"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const barColors = ["#0f3d5e", "#165073", "#1e6287", "#2d8298", "#4fae9d", "#6dc7b0", "#f28f6b"];

export default function UsageHistoryChart({ data = [], isLoading }) {
  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Uso de los últimos 7 días</p>
          <h2 className="text-lg font-semibold text-ink">Historial de consumo</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          7 días
        </span>
      </div>

      <div className="mt-5 h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500">
            Cargando historial...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500">
            Aún no hay datos para mostrar en el historial.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
              <Tooltip
                cursor={{ fill: "rgba(15, 61, 94, 0.06)" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 30px rgba(8, 18, 29, 0.08)"
                }}
                formatter={(value) => [`${value} tokens`, "Consumo"]}
                labelFormatter={(label) => `Día: ${label}`}
              />
              <Bar dataKey="tokens" radius={[12, 12, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
