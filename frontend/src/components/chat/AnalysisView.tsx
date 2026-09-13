"use client";

import { useId } from "react";

import type { AnalysisBlock } from "@/lib/types";

const ROW_DISPLAY_CAP = 25;
const SERIES_OPACITY = [1, 0.55, 0.32];

function fmtCell(v: string | number | boolean | null): string {
  if (v === null) return "–";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v;
}

/**
 * Renders the structured (columns/rows) result of a text-to-SQL analysis
 * as a real table, plus a small dependency-free SVG bar/line chart when the
 * backend's chart hint applies. Kept hand-rolled (no chart lib) to match
 * AnswerText's dependency-free approach and avoid a new bundle dependency
 * for two chart types.
 */
export function AnalysisView({ analysis }: { analysis: AnalysisBlock }) {
  if (!analysis.ok || analysis.rows.length === 0) return null;
  const shown = analysis.rows.slice(0, ROW_DISPLAY_CAP);
  const hiddenCount = analysis.rows.length - shown.length;

  return (
    <div className="mt-3.5 space-y-3">
      {analysis.chart && <MiniChart chart={analysis.chart} columns={analysis.columns} rows={analysis.rows} />}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-surface-sunken">
              {analysis.columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-content-secondary">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, ri) => (
              <tr key={ri} className={ri > 0 ? "border-t border-line/60" : undefined}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`whitespace-nowrap px-2.5 py-1.5 tnum ${
                      typeof cell === "number" ? "text-right" : "text-left"
                    }`}
                  >
                    {fmtCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(hiddenCount > 0 || analysis.truncated) && (
        <p className="text-2xs text-content-muted">
          {hiddenCount > 0 ? `+${hiddenCount} more row${hiddenCount === 1 ? "" : "s"} not shown` : null}
          {hiddenCount > 0 && analysis.truncated ? " · " : null}
          {analysis.truncated ? "results capped for performance" : null}
        </p>
      )}
    </div>
  );
}

function MiniChart({
  chart,
  columns,
  rows,
}: {
  chart: NonNullable<AnalysisBlock["chart"]>;
  columns: string[];
  rows: AnalysisBlock["rows"];
}) {
  const gid = useId();
  const xi = columns.indexOf(chart.x);
  const seriesIdx = chart.series.map((s) => columns.indexOf(s)).filter((i) => i >= 0);
  if (xi < 0 || seriesIdx.length === 0) return null;

  const W = 640;
  const H = 200;
  const padL = 44;
  const padB = 24;
  const padT = 10;
  const padR = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const categories = rows.map((r) => String(r[xi] ?? ""));
  const seriesData = seriesIdx.map((si) => rows.map((r) => (typeof r[si] === "number" ? (r[si] as number) : 0)));
  const maxVal = Math.max(1, ...seriesData.flat());
  const showLabels = categories.length <= 12;

  const xPos = (i: number) => padL + (categories.length <= 1 ? plotW / 2 : (i / (categories.length - 1 || 1)) * plotW);
  const yPos = (v: number) => padT + plotH - (v / maxVal) * plotH;

  return (
    <div className="rounded-lg border border-line p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto", maxHeight: 200 }}>
        {/* y gridlines + labels */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={padL}
              x2={W - padR}
              y1={padT + plotH * (1 - f)}
              y2={padT + plotH * (1 - f)}
              stroke="rgb(var(--line))"
              strokeWidth={1}
            />
            <text x={padL - 6} y={padT + plotH * (1 - f) + 3} textAnchor="end" fontSize={9} fill="rgb(var(--content-muted))">
              {Math.round(maxVal * f).toLocaleString()}
            </text>
          </g>
        ))}

        {chart.type === "bar" ? (
          <>
            {categories.map((_, ci) => {
              const groupW = plotW / categories.length;
              const barGap = 2;
              const barW = Math.max(2, (groupW - barGap * (seriesIdx.length + 1)) / seriesIdx.length);
              const groupX = padL + ci * groupW;
              return seriesIdx.map((_, si) => {
                const v = seriesData[si][ci];
                const bx = groupX + barGap + si * (barW + barGap);
                const by = yPos(v);
                return (
                  <rect
                    key={si}
                    x={bx}
                    y={by}
                    width={barW}
                    height={Math.max(0, padT + plotH - by)}
                    fill={`rgb(var(--accent) / ${SERIES_OPACITY[si % SERIES_OPACITY.length]})`}
                  >
                    <title>
                      {categories[ci]} · {chart.series[si]}: {v.toLocaleString()}
                    </title>
                  </rect>
                );
              });
            })}
          </>
        ) : (
          seriesIdx.map((_, si) => {
            const points = seriesData[si].map((v, ci) => `${xPos(ci)},${yPos(v)}`).join(" ");
            return (
              <g key={si}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={`rgb(var(--accent) / ${SERIES_OPACITY[si % SERIES_OPACITY.length]})`}
                  strokeWidth={2}
                />
                {seriesData[si].map((v, ci) => (
                  <circle key={ci} cx={xPos(ci)} cy={yPos(v)} r={2.5} fill={`url(#${gid}-${si})`} stroke="none">
                    <title>
                      {categories[ci]} · {chart.series[si]}: {v.toLocaleString()}
                    </title>
                  </circle>
                ))}
                <defs>
                  <radialGradient id={`${gid}-${si}`}>
                    <stop offset="0%" stopColor={`rgb(var(--accent) / ${SERIES_OPACITY[si % SERIES_OPACITY.length]})`} />
                  </radialGradient>
                </defs>
              </g>
            );
          })
        )}

        {/* x labels */}
        {showLabels &&
          categories.map((c, i) => (
            <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="rgb(var(--content-muted))">
              {c.length > 10 ? `${c.slice(0, 9)}…` : c}
            </text>
          ))}
      </svg>
      {chart.series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-content-secondary">
          {chart.series.map((s, si) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: `rgb(var(--accent) / ${SERIES_OPACITY[si % SERIES_OPACITY.length]})` }}
              />
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
