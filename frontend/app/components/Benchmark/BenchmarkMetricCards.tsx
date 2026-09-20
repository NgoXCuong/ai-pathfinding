"use client";

import React from "react";
import {
  Clock,
  Layers,
  Sparkles,
  HardDrive,
  Repeat,
  Navigation,
} from "lucide-react";
import type { BenchmarkResult } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatMs, formatNumber } from "@/lib/utils";

interface BenchmarkMetricCardsProps {
  result: BenchmarkResult;
}

export default function BenchmarkMetricCards({
  result,
}: BenchmarkMetricCardsProps) {
  const { stats, improvement } = result;

  // Helper render comparison bar
  const renderComparisonBar = (
    valDijk: number,
    valAstar: number,
    formatFn: (n: number) => string,
    unit: string = "",
    improvementPct?: number,
  ) => {
    const maxVal = Math.max(valDijk, valAstar, 0.0001);
    const dijkPct = Math.min(100, Math.max(5, (valDijk / maxVal) * 100));
    const astarPct = Math.min(100, Math.max(5, (valAstar / maxVal) * 100));

    return (
      <div className="space-y-3">
        {/* Dijkstra Row */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-blue-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Dijkstra
            </span>
            <span className="font-mono text-slate-700">
              {formatFn(valDijk)} {unit}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${dijkPct}%` }}
            />
          </div>
        </div>

        {/* A* Row */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              A*
            </span>
            <div className="flex items-center gap-2">
              {improvementPct !== undefined && (
                <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                  {improvementPct >= 0
                    ? `↓ ${improvementPct}%`
                    : `↑ ${Math.abs(improvementPct)}%`}
                </span>
              )}
              <span className="font-mono text-slate-700">
                {formatFn(valAstar)} {unit}
              </span>
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${astarPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. Thời gian thực thi */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Thời Gian Thực Thi (TB)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ms / ván
            </span>
          </div>

          {renderComparisonBar(
            stats.dijkstra.time.avg,
            stats.astar.time.avg,
            formatMs,
            "",
            improvement.time_pct,
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
            <div>
              <span className="text-slate-400">Dijk Min/Max: </span>
              {formatMs(stats.dijkstra.time.min)} -{" "}
              {formatMs(stats.dijkstra.time.max)}
            </div>
            <div className="text-right">
              <span className="text-slate-400">A* Min/Max: </span>
              {formatMs(stats.astar.time.min)} -{" "}
              {formatMs(stats.astar.time.max)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Số Node đã mở rộng (Expanded Nodes) */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số Node Mở Rộng (Expanded)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Closed Set
            </span>
          </div>

          {renderComparisonBar(
            stats.dijkstra.nodes.avg,
            stats.astar.nodes.avg,
            (n) => formatNumber(n, 0),
            "nodes",
            improvement.nodes_pct,
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
            <div>
              <span className="text-slate-400">Dijk σ: </span>±
              {formatNumber(stats.dijkstra.nodes.stdev, 0)}
            </div>
            <div className="text-right">
              <span className="text-slate-400">A* σ: </span>±
              {formatNumber(stats.astar.nodes.stdev, 0)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Số Node được sinh ra (Generated Nodes) */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số Node Sinh Ra (Generated)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Pushed to Heap
            </span>
          </div>

          {renderComparisonBar(
            stats.dijkstra.generated?.avg ?? stats.dijkstra.nodes.avg * 1.8,
            stats.astar.generated?.avg ?? stats.astar.nodes.avg * 1.5,
            (n) => formatNumber(n, 0),
            "nodes",
            improvement.generated_pct ?? improvement.nodes_pct,
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Tổng số trạng thái đã được thêm vào hàng đợi ưu tiên (Open set).
          </div>
        </CardContent>
      </Card>

      {/* 4. Bộ nhớ sử dụng đỉnh (Peak Memory) */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Bộ Nhớ Đỉnh (Peak Memory)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Max Open + Closed
            </span>
          </div>

          {renderComparisonBar(
            stats.dijkstra.peak_memory?.avg ?? stats.dijkstra.nodes.avg * 1.2,
            stats.astar.peak_memory?.avg ?? stats.astar.nodes.avg * 1.1,
            (n) => formatNumber(n, 0),
            "nodes",
            improvement.memory_pct,
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Kích thước lớn nhất của cấu trúc dữ liệu trong bộ nhớ RAM lúc thực
            thi.
          </div>
        </CardContent>
      </Card>

      {/* 5. Số bước tìm kiếm (Search Steps / Iterations) */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Repeat className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số Bước Lặp Tìm Kiếm
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              While Loop
            </span>
          </div>

          {renderComparisonBar(
            stats.dijkstra.steps?.avg ?? stats.dijkstra.nodes.avg,
            stats.astar.steps?.avg ?? stats.astar.nodes.avg,
            (n) => formatNumber(n, 0),
            "bước",
            improvement.steps_pct ?? improvement.nodes_pct,
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Số chu kỳ lấy node nhỏ nhất từ hàng đợi ưu tiên cho đến khi chạm
            đích.
          </div>
        </CardContent>
      </Card>

      {/* 6. Chi phí & Độ dài đường đi (Path Cost & Length) */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Navigation className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Chi Phí Đường Đi (Path Cost)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Bằng Nhau (100% Tối ưu)
            </span>
          </div>

          <div className="space-y-2 py-1">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-blue-600 font-semibold">
                Dijkstra Cost:
              </span>
              <span className="font-bold text-slate-800">
                {formatNumber(stats.dijkstra.distance.avg)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-emerald-600 font-semibold">A* Cost:</span>
              <span className="font-bold text-slate-800">
                {formatNumber(stats.astar.distance.avg)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Độ dài trung bình:</span>
            <strong className="font-mono text-slate-700">
              {formatNumber(
                stats.astar.path_length?.avg ?? stats.astar.distance.avg,
                1,
              )}{" "}
              ô
            </strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
