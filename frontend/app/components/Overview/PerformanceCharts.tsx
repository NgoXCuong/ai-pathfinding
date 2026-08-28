"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, BarChart, Bar,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { BarChart3, TrendingUp } from "lucide-react";

interface ChartsProps {
  historyList: HistoryItem[];
}

const CHART_TABS = ["Thời gian chạy", "Nodes đã thăm", "So sánh"] as const;
type ChartTab = typeof CHART_TABS[number];

const fmtMs = (v: ValueType | undefined, _n: NameType | undefined): [string, NameType | undefined] =>
  [`${Number(v ?? 0).toFixed(4)} ms`, _n];

const fmtNodes = (v: ValueType | undefined, _n: NameType | undefined): [string, NameType | undefined] =>
  [Number(v ?? 0).toLocaleString(), _n];

export default function PerformanceCharts({ historyList }: ChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartTab>("Thời gian chạy");

  if (historyList.length === 0) return null;

  const last10 = historyList.slice(0, 10).reverse();
  const lineData = last10.map((run, i) => {
    const astar = run.results?.find((r) => r.algorithm === "astar");
    const dijk = run.results?.find((r) => r.algorithm === "dijkstra");
    return {
      name: `#${historyList.length - i - (historyList.length - last10.length)}`,
      astarTime: astar?.execution_time ? Number(astar.execution_time.toFixed(4)) : 0,
      dijkTime: dijk?.execution_time ? Number(dijk.execution_time.toFixed(4)) : 0,
      astarNodes: astar?.nodes_visited || 0,
      dijkNodes: dijk?.nodes_visited || 0,
    };
  });

  const heuristicRuns = historyList.filter((h) => h.map_type === "grid").slice(0, 6);
  const barData = heuristicRuns.map((run, i) => {
    const astar = run.results?.find((r) => r.algorithm === "astar");
    const dijk = run.results?.find((r) => r.algorithm === "dijkstra");
    return {
      name: astar?.heuristic || `Run ${i + 1}`,
      astar: astar?.execution_time ? Number(astar.execution_time.toFixed(4)) : 0,
      dijkstra: dijk?.execution_time ? Number(dijk.execution_time.toFixed(4)) : 0,
    };
  });

  const sharedTooltipProps = {
    contentStyle: {
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      fontSize: 12,
      fontWeight: 600,
    },
    itemStyle: { fontSize: 12, fontWeight: 700 },
    labelStyle: { fontSize: 11, color: "#94a3b8", marginBottom: 4 },
  };

  const commonLineProps = {
    strokeWidth: 2.5,
    dot: { r: 4, strokeWidth: 2, stroke: "#fff" },
    activeDot: { r: 7 },
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Xu hướng hiệu suất</h3>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {CHART_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${activeChart === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 pb-0">
          {/* Runtime Tab */}
          {activeChart === "Thời gian chạy" && (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip {...sharedTooltipProps} formatter={fmtMs} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }} />
                  <Line {...commonLineProps} type="monotone" name="Dijkstra" dataKey="dijkTime" stroke="#3b82f6" dot={{ ...commonLineProps.dot, fill: "#3b82f6" }} />
                  <Line {...commonLineProps} type="monotone" name="A*" dataKey="astarTime" stroke="#06b6d4" dot={{ ...commonLineProps.dot, fill: "#06b6d4" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Nodes Visited Tab */}
          {activeChart === "Nodes đã thăm" && (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} dy={6} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  />
                  <Tooltip {...sharedTooltipProps} formatter={fmtNodes} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }} />
                  <Line {...commonLineProps} type="monotone" name="Dijkstra" dataKey="dijkNodes" stroke="#3b82f6" dot={{ ...commonLineProps.dot, fill: "#3b82f6" }} />
                  <Line {...commonLineProps} type="monotone" name="A*" dataKey="astarNodes" stroke="#06b6d4" dot={{ ...commonLineProps.dot, fill: "#06b6d4" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar Comparison Tab */}
          {activeChart === "So sánh" && (
            <div className="h-[260px]">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip {...sharedTooltipProps} formatter={fmtMs} />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12 }} />
                    <Bar name="Dijkstra" dataKey="dijkstra" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="A*" dataKey="astar" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <BarChart3 className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">Chưa có dữ liệu Grid để so sánh</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
