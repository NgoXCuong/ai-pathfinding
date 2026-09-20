"use client";

import React from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import type { BenchmarkResult } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatMs, formatNumber } from "@/lib/utils";
import { LineChart as LineChartIcon, Clock, BarChart2 } from "lucide-react";

interface BenchmarkChartsProps {
  result: BenchmarkResult;
  onSelectRun?: (runNum: number) => void;
}

export default function BenchmarkCharts({
  result,
  onSelectRun,
}: BenchmarkChartsProps) {
  const { raw_results, stats } = result;

  // Prepare chart data for run-by-run
  const runData = raw_results.map((r) => {
    const diffNodes = r.dijkstra_nodes - r.astar_nodes;
    const diffPct =
      r.dijkstra_nodes > 0
        ? Math.round((diffNodes / r.dijkstra_nodes) * 100)
        : 0;

    return {
      run: `#${r.run}`,
      runNum: r.run,
      seed: r.seed,
      dijkstraNodes: r.dijkstra_nodes,
      astarNodes: r.astar_nodes,
      dijkstraTime: Number(r.dijkstra_time.toFixed(3)),
      astarTime: Number(r.astar_time.toFixed(3)),
      diffPct,
      speedup:
        r.astar_time > 0
          ? Number((r.dijkstra_time / r.astar_time).toFixed(2))
          : 1.0,
    };
  });

  // Prepare distribution data for Min - Avg - Max
  const distData = [
    {
      metric: "Tối Thiểu (Min)",
      dijkstra: stats.dijkstra.nodes.min,
      astar: stats.astar.nodes.min,
    },
    {
      metric: "Trung Bình (Avg)",
      dijkstra: stats.dijkstra.nodes.avg,
      astar: stats.astar.nodes.avg,
    },
    {
      metric: "Tối Đa (Max)",
      dijkstra: stats.dijkstra.nodes.max,
      astar: stats.astar.nodes.max,
    },
  ];

  const tooltipStyle = {
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    border: "1px solid #334155",
    color: "#f8fafc",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
    fontSize: "12px",
    padding: "10px 14px",
  };

  return (
    <div className="space-y-5">
      {/* ── CHART 1: Nút Duyệt Qua Từng Lượt Chạy (Full-width Area Chart) ── */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-indigo-600" />
                1. Biểu Đồ Số Node Mở Rộng Qua Từng Lượt Chạy (Expanded Nodes)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Khoảng cách phân kỳ rõ rệt giữa Dijkstra (đường xanh dương) và
                A* (vùng xanh ngọc) trên {raw_results.length} lượt chạy
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Dijkstra ({formatNumber(stats.dijkstra.nodes.avg, 0)} nodes TB)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                A* ({formatNumber(stats.astar.nodes.avg, 0)} nodes TB)
              </span>
            </div>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={runData}
                onClick={(e: unknown) => {
                  const evt = e as {
                    activePayload?: Array<{ payload?: { runNum?: number } }>;
                  };
                  if (evt?.activePayload && evt.activePayload.length > 0) {
                    const runNum = evt.activePayload[0].payload?.runNum;
                    if (runNum && onSelectRun) onSelectRun(runNum);
                  }
                }}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorDijk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAstar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="run"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(
                    val: ValueType | undefined,
                    name: NameType | undefined,
                  ) => [
                    formatNumber(Number(val ?? 0), 0) + " nodes",
                    name === "dijkstraNodes" ? "Dijkstra" : "A*",
                  ]}
                  labelFormatter={(label, items) => {
                    const item = items?.[0]?.payload;
                    return `${label} (Seed: ${item?.seed}) — A* tiết kiệm: ↓${item?.diffPct}% nút`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="dijkstraNodes"
                  name="dijkstraNodes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDijk)"
                />
                <Area
                  type="monotone"
                  dataKey="astarNodes"
                  name="astarNodes"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAstar)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── ROW 2: 2 Biểu Đồ Bên Dưới (Thời Gian & Phân Phối Cột) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 2: Thời Gian Thực Thi (Execution Time Line Chart) */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                2. Thời Gian Thực Thi (ms)
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                A* nhanh hơn{" "}
                {(
                  stats.dijkstra.time.avg /
                  Math.max(stats.astar.time.avg, 0.001)
                ).toFixed(1)}
                ×
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={runData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="run"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(
                      val: ValueType | undefined,
                      name: NameType | undefined,
                    ) => [
                      formatMs(Number(val ?? 0)),
                      name === "dijkstraTime" ? "Dijkstra" : "A*",
                    ]}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return `${label} — Tăng tốc: ${item?.speedup}×`;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dijkstraTime"
                    name="dijkstraTime"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="astarTime"
                    name="astarTime"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CHART 3: Phân Phối Min - Avg - Max (Bar Chart) */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                3. So Sánh Phổ Thống Kê (Min - Avg - Max)
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Độ phân tán node duyệt
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(
                      val: ValueType | undefined,
                      name: NameType | undefined,
                    ) => [
                      formatNumber(Number(val ?? 0), 0) + " nodes",
                      name === "dijkstra" ? "Dijkstra" : "A*",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
                    formatter={(value) =>
                      value === "dijkstra" ? "Dijkstra" : "A*"
                    }
                  />
                  <Bar
                    dataKey="dijkstra"
                    name="dijkstra"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="astar"
                    name="astar"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
