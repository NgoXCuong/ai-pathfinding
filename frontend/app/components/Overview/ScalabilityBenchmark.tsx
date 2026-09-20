"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Layers, BarChart2, Table as TableIcon, Sparkles } from "lucide-react";
import type { HistoryItem } from "@/lib/types";
import { formatMs, formatNumber } from "@/lib/utils";

interface ScalabilityBenchmarkProps {
  historyList: HistoryItem[];
}

export default function ScalabilityBenchmark({
  historyList,
}: ScalabilityBenchmarkProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [metricMode, setMetricMode] = useState<"nodes" | "time">("nodes");

  // Aggregate data by grid size / map type
  const benchmarkData = useMemo(() => {
    if (!historyList || historyList.length === 0) return [];

    const sizeMap = new Map<
      string,
      {
        label: string;
        numericSize: number;
        count: number;
        dijkNodesList: number[];
        astarNodesList: number[];
        dijkTimeList: number[];
        astarTimeList: number[];
      }
    >();

    historyList.forEach((run) => {
      if (!run.results || run.results.length === 0) return;
      const dijk = run.results.find((r) => r.algorithm === "dijkstra");
      const astar = run.results.find((r) => r.algorithm === "astar");
      if (!dijk || !astar) return;

      const isOsm = run.map_type === "osm";
      const key = isOsm ? "OSM" : `grid_${run.grid_size || 20}`;
      const label = isOsm ? "OSM Map" : `${run.grid_size || 20}×${run.grid_size || 20}`;
      const numericSize = isOsm ? 999 : run.grid_size || 20;

      if (!sizeMap.has(key)) {
        sizeMap.set(key, {
          label,
          numericSize,
          count: 0,
          dijkNodesList: [],
          astarNodesList: [],
          dijkTimeList: [],
          astarTimeList: [],
        });
      }

      const group = sizeMap.get(key)!;
      group.count += 1;
      group.dijkNodesList.push(dijk.nodes_visited || 0);
      group.astarNodesList.push(astar.nodes_visited || 0);
      group.dijkTimeList.push(dijk.execution_time || 0);
      group.astarTimeList.push(astar.execution_time || 0);
    });

    const list = Array.from(sizeMap.values()).map((g) => {
      const avgDijkNodes = Math.round(
        g.dijkNodesList.reduce((a, b) => a + b, 0) / g.dijkNodesList.length
      );
      const avgAstarNodes = Math.round(
        g.astarNodesList.reduce((a, b) => a + b, 0) / g.astarNodesList.length
      );
      const avgDijkTime = Number(
        (
          g.dijkTimeList.reduce((a, b) => a + b, 0) / g.dijkTimeList.length
        ).toFixed(3)
      );
      const avgAstarTime = Number(
        (
          g.astarTimeList.reduce((a, b) => a + b, 0) / g.astarTimeList.length
        ).toFixed(3)
      );

      const nodeSavingsPct =
        avgDijkNodes > 0
          ? Number(
              (((avgDijkNodes - avgAstarNodes) / avgDijkNodes) * 100).toFixed(1)
            )
          : 0;

      const timeSavingsPct =
        avgDijkTime > 0
          ? Number(
              (((avgDijkTime - avgAstarTime) / avgDijkTime) * 100).toFixed(1)
            )
          : 0;

      return {
        label: g.label,
        numericSize: g.numericSize,
        count: g.count,
        dijkstraNodes: avgDijkNodes,
        astarNodes: avgAstarNodes,
        dijkstraTime: avgDijkTime,
        astarTime: avgAstarTime,
        nodeSavingsPct,
        timeSavingsPct,
      };
    });

    // Sort by numeric size
    return list.sort((a, b) => a.numericSize - b.numericSize);
  }, [historyList]);

  if (benchmarkData.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm h-full flex flex-col">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
          <Layers className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            Chưa có dữ liệu phân tích quy mô
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Thực hiện các lượt chạy trên các kích thước lưới khác nhau (ví dụ
            20×20, 50×50, 80×80) để thấy sự khác biệt về độ phức tạp thuật toán.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
      {/* ── Header Card ── */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Khả Năng Mở Rộng Theo Quy Mô (Scalability Benchmark)
            </h3>
            <p className="text-xs text-slate-400">
              So sánh hiệu năng khi kích thước không gian tìm kiếm tăng dần
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1.5">
          {viewMode === "chart" && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mr-1 text-xs">
              <button
                onClick={() => setMetricMode("nodes")}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  metricMode === "nodes"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Nodes
              </button>
              <button
                onClick={() => setMetricMode("time")}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  metricMode === "time"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Thời gian
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-md ${
                viewMode === "chart"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("chart")}
              title="Xem dạng biểu đồ"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-md ${
                viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("table")}
              title="Xem dạng bảng"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between bg-slate-50/30">
        {/* ── Content View ── */}
        {viewMode === "chart" ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  tickFormatter={(v) =>
                    metricMode === "nodes"
                      ? v >= 1000
                        ? `${(v / 1000).toFixed(1)}k`
                        : v
                      : `${v}ms`
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  formatter={(val: unknown) => [
                    metricMode === "nodes"
                      ? `${formatNumber(Number(val))} nodes`
                      : formatMs(Number(val)),
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 4 }}
                />
                <Bar
                  dataKey={
                    metricMode === "nodes" ? "dijkstraNodes" : "dijkstraTime"
                  }
                  name="Dijkstra"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={metricMode === "nodes" ? "astarNodes" : "astarTime"}
                  name="A*"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Quy mô</th>
                  <th className="py-2.5 px-3 text-center">Lượt</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">
                    Dijkstra (TB)
                  </th>
                  <th className="py-2.5 px-3 text-right text-cyan-700">
                    A* (TB)
                  </th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">
                    A* Tiết kiệm
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {benchmarkData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-sans font-bold text-slate-700">
                      {row.label}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">
                      {row.count}
                    </td>
                    <td className="py-2 px-3 text-right text-blue-600 font-semibold">
                      {formatNumber(row.dijkstraNodes)} n
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-600 font-semibold">
                      {formatNumber(row.astarNodes)} n
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-1.5 py-0.5"
                      >
                        ↓ {row.nodeSavingsPct}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Academic Insight Footer ── */}
        <div className="mt-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2 text-xs text-indigo-900 leading-relaxed">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Quy luật tiệm cận:</strong> Khi kích thước tăng dần từ nhỏ tới
            lớn, số node mở rộng của Dijkstra bùng nổ theo diện tích $O(V)$, trong
            khi hàm Heuristic giúp A* tập trung theo hình phễu, giúp tỷ lệ tiết
            kiệm node luôn duy trì ở mức cao.
          </span>
        </div>
      </div>
    </Card>
  );
}
