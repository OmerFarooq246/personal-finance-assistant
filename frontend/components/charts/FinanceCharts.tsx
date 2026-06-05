"use client";

import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { categorySpendingData, formatCurrency, monthlyCashflowData, palette } from "@/lib/finance";
import type { Transaction } from "@/lib/types";

export function MonthlyCashflowChart({ transactions }: { transactions: Transaction[] }) {
  const data = monthlyCashflowData(transactions);

  return (
    <div className="h-[290px] w-full">
      <ResponsiveBar
        data={data}
        keys={["Income", "Expenses"]}
        indexBy="month"
        margin={{ top: 20, right: 15, bottom: 40, left: 75 }}
        padding={0.42}
        groupMode="grouped"
        valueScale={{ type: "linear" }}
        colors={[palette.primary, "#ffb3ae"]}
        borderRadius={2}
        enableLabel={false}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          format: (value) => `PKR ${(Number(value) / 1000).toFixed(0)}k`,
        }}
        gridYValues={4}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: palette.onSurfaceVariant,
                fontFamily: "Mona Sans, sans-serif",
                fontSize: 11,
              },
            },
          },
          grid: {
            line: {
              stroke: "rgba(188, 202, 192, 0.45)",
              strokeWidth: 1,
            },
          },
          tooltip: {
            container: {
              background: palette.onSurface,
              borderRadius: 6,
              color: palette.surface,
              fontFamily: "Mona Sans, sans-serif",
              fontSize: 12,
            },
          },
        }}
        tooltip={({ id, value, indexValue }) => (
          <div className="rounded-md bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface">
            {indexValue} {id}: {formatCurrency(Number(value))}
          </div>
        )}
      />
    </div>
  );
}

export function CategoryDonutChart({ transactions }: { transactions: Transaction[] }) {
  const data = categorySpendingData(transactions);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-lg border border-dashed border-outline-variant text-center text-on-surface-variant">
        No expense categories yet.
      </div>
    );
  }

  return (
    <div className="flex min-h-[250px] flex-col">
      <div className="relative h-[172px] w-full">
        <ResponsivePie
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          innerRadius={0.62}
          padAngle={1.4}
          cornerRadius={3}
          colors={{ datum: "data.color" }}
          borderWidth={0}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          theme={{
            tooltip: {
              container: {
                background: palette.onSurface,
                borderRadius: 6,
                color: palette.surface,
                fontFamily: "Mona Sans, sans-serif",
                fontSize: 12,
              },
            },
          }}
          tooltip={({ datum }) => (
            <div className="rounded-md bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface">
              {datum.label}: {formatCurrency(Number(datum.value))}
            </div>
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="numeral-md text-on-surface">{formatCurrency(total, { compact: true })}</span>
          <span className="label-md text-[10px] text-on-surface-variant">Total Spend</span>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {data.slice(0, 4).map((item) => (
          <div className="flex items-center justify-between text-sm" key={item.id}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate text-on-surface-variant">{item.label}</span>
            </div>
            <span className="numeral-md text-[13px]">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
