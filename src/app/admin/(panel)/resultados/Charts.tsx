const COLORS = ["#2563eb", "#059669", "#d97706", "#e11d48", "#7c3aed", "#0891b2", "#65a30d"];

export type Segmento = { label: string; total: number; porcentaje: number };

export function BarChart({ datos }: { datos: Segmento[] }) {
  const max = Math.max(1, ...datos.map((d) => d.total));

  return (
    <div className="flex flex-col gap-3">
      {datos.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span className="truncate pr-2">{d.label}</span>
            <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
              {d.total} ({d.porcentaje}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(d.total / max) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ datos }: { datos: Segmento[] }) {
  const total = datos.reduce((sum, d) => sum + d.total, 0);
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-100 dark:text-zinc-800" />
        {total > 0 &&
          datos
            .filter((d) => d.total > 0)
            .map((d, i) => {
              const fraccion = d.total / total;
              const dash = fraccion * circumference;
              const offset = -((acumulado / total) * circumference);
              acumulado += d.total;
              return (
                <circle
                  key={d.label}
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="4"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
      </svg>
      <ul className="flex flex-col gap-1.5 text-xs">
        {datos.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-zinc-600 dark:text-zinc-400">{d.label}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{d.porcentaje}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
