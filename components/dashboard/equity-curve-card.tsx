import type { Trade } from "@/lib/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";

const W = 300;
const H = 96;
const PAD = 8;

/** Catmull-Rom → cubic bezier for the design's smooth curve. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });

export function EquityCurveCard({ trades }: { trades: Trade[] }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.getDate();

  // Cumulative booked P&L per day, month-to-date.
  const daily = new Map<number, number>();
  for (const t of trades) {
    if (t.net_pnl == null || t.date < monthStart) continue;
    const d = t.date.getDate();
    daily.set(d, (daily.get(d) ?? 0) + t.net_pnl);
  }
  let cumulative = 0;
  const values: number[] = [0];
  for (let d = 1; d <= today; d++) {
    cumulative += daily.get(d) ?? 0;
    values.push(cumulative);
  }

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: PAD + (1 - (v - min) / span) * (H - PAD * 2),
  }));
  const line = smoothPath(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];
  const rising = values[values.length - 1] >= 0;
  const stroke = rising ? "var(--success)" : "var(--destructive)";

  return (
    <Card className="py-5">
      <CardContent className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[15px] font-bold">Equity Curve</p>
          <p className="text-xs font-bold text-muted-foreground">
            {monthShort.format(now)} · MTD
          </p>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-24 w-full"
          role="img"
          aria-label="Cumulative month-to-date P&L"
        >
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#eqFill)" />
          <path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={last.x}
            cy={last.y}
            r="4"
            fill={stroke}
            stroke="var(--card)"
            strokeWidth="2"
          />
        </svg>
        <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>
            {monthShort.format(monthStart)} 1
          </span>
          <span>
            {monthShort.format(now)} {today}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
