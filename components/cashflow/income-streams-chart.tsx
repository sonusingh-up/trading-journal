"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { sourceSlug, type MonthlyIncomeRow } from "@/lib/income";

const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function IncomeStreamsChart({
  data,
  sources,
}: {
  data: MonthlyIncomeRow[];
  /** Display names in fixed order — color follows the source, never its rank. */
  sources: string[];
}) {
  const config: ChartConfig = Object.fromEntries(
    sources.map((name, i) => [
      sourceSlug(name),
      { label: name, color: SERIES_COLORS[i % SERIES_COLORS.length] },
    ]),
  );

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <BarChart data={data} barGap={2} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value: number) => compactUsd.format(value)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {sources.map((name) => (
          <Bar
            key={name}
            dataKey={sourceSlug(name)}
            fill={`var(--color-${sourceSlug(name)})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
