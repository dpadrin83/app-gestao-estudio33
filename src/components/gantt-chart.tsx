"use client";

import { cn } from "@/lib/utils";
import {
  activityStatusBarClass,
  barPosition,
  ganttRange,
  type GanttBar,
} from "@/lib/gantt-utils";
import { formatDateShort } from "@/lib/format";

export function GanttChart({
  bars,
  showGroups = false,
}: {
  bars: GanttBar[];
  showGroups?: boolean;
}) {
  const { rangeStart, totalDays } = ganttRange(bars);

  if (bars.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade no cronograma.
      </p>
    );
  }

  const grouped = showGroups
    ? groupBy(bars, (b) => b.groupKey ?? "_")
    : new Map([["_", bars]]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card/30">
      <div className="min-w-[640px] p-4">
        <div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{formatDateShort(rangeStart)}</span>
          <span>timeline · {totalDays} dias</span>
        </div>
        <div className="space-y-2">
          {Array.from(grouped.entries()).map(([key, groupBars]) => (
            <div key={key}>
              {showGroups && key !== "_" && groupBars[0]?.groupLabel && (
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-brand-orange">
                  {groupBars[0].groupLabel}
                </p>
              )}
              {groupBars.map((bar) => {
                const pos = barPosition(
                  bar.start,
                  bar.end,
                  rangeStart,
                  totalDays,
                );
                return (
                  <div
                    key={bar.id}
                    className="grid grid-cols-[minmax(140px,200px)_1fr] items-center gap-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{bar.label}</p>
                      {bar.sublabel && (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {bar.sublabel}
                        </p>
                      )}
                    </div>
                    <div className="relative h-7 rounded-md bg-secondary/40">
                      <div
                        className={cn(
                          "absolute top-1 bottom-1 rounded-md transition-all",
                          activityStatusBarClass[bar.status],
                          bar.color,
                        )}
                        style={{
                          left: `${pos.left}%`,
                          width: `${pos.width}%`,
                        }}
                        title={`${bar.start} → ${bar.end}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = keyFn(item);
    const list = map.get(k) ?? [];
    list.push(item);
    map.set(k, list);
  }
  return map;
}
