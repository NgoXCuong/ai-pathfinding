"use client";
import React from "react";
import { Route, XCircle } from "lucide-react";
import { formatMs, formatNumber } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";

interface ComparisonTableProps {
  latestRun?: HistoryItem;
}

export default function ComparisonTable({ latestRun }: ComparisonTableProps) {
  if (!latestRun?.results) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center h-full">
        <Route className="w-10 h-10 text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-400">Chưa có dữ liệu so sánh</p>
        <p className="text-[13px] text-slate-300 mt-1">Thực hiện một lần chạy để xem so sánh chi tiết</p>
      </div>
    );
  }

  const astar = latestRun.results.find((r) => r.algorithm === "astar") || latestRun.results[0];
  const dijkstra = latestRun.results.find((r) => r.algorithm === "dijkstra") || latestRun.results[0];
  const notFound = astar?.found === false || dijkstra?.found === false;

  const dijkTime = dijkstra?.execution_time || 0;
  const astarTime = astar?.execution_time || 0;
  const dijkNodes = dijkstra?.nodes_visited || 0;
  const astarNodes = astar?.nodes_visited || 0;

  let timeWinner = "equal";
  let timeImpStr = "—";
  if (dijkTime > 0 && astarTime > 0 && Math.abs(dijkTime - astarTime) > 0.001) {
    if (astarTime < dijkTime) {
      timeWinner = "astar";
      timeImpStr = `A* ↓ ${((dijkTime - astarTime) / dijkTime * 100).toFixed(1)}%`;
    } else {
      timeWinner = "dijkstra";
      timeImpStr = `Dijk ↓ ${((astarTime - dijkTime) / astarTime * 100).toFixed(1)}%`;
    }
  }

  let nodeWinner = "equal";
  let nodeImpStr = "—";
  if (dijkNodes > 0 && astarNodes > 0 && dijkNodes !== astarNodes) {
    if (astarNodes < dijkNodes) {
      nodeWinner = "astar";
      nodeImpStr = `A* ↓ ${((dijkNodes - astarNodes) / dijkNodes * 100).toFixed(1)}%`;
    } else {
      nodeWinner = "dijkstra";
      nodeImpStr = `Dijk ↓ ${((astarNodes - dijkNodes) / astarNodes * 100).toFixed(1)}%`;
    }
  }

  // Bar widths
  const maxTime = Math.max(dijkTime, astarTime, 0.0001);
  const maxNodes = Math.max(dijkNodes, astarNodes, 1);

  const rows = [
    {
      label: "Thời gian thực thi",
      dijkVal: formatMs(dijkTime),
      astarVal: formatMs(astarTime),
      dijkWidth: (dijkTime / maxTime) * 100,
      astarWidth: (astarTime / maxTime) * 100,
      winner: timeWinner,
      improvement: timeImpStr,
    },
    {
      label: "Node đã duyệt",
      dijkVal: formatNumber(dijkNodes),
      astarVal: formatNumber(astarNodes),
      dijkWidth: (dijkNodes / maxNodes) * 100,
      astarWidth: (astarNodes / maxNodes) * 100,
      winner: nodeWinner,
      improvement: nodeImpStr,
    },
    {
      label: "Độ dài đường đi",
      dijkVal: (dijkstra?.distance || 0).toFixed(3),
      astarVal: (astar?.distance || 0).toFixed(3),
      dijkWidth: 100,
      astarWidth: 100,
      winner: "equal" as const,
      improvement: "✓ Bằng nhau",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 shrink-0">
        <h3 className="text-sm font-bold text-slate-800">So sánh thuật toán — Lần chạy mới nhất</h3>
        <p className="text-sm text-slate-400 mt-0.5">
          Môi trường: {latestRun.map_type === "osm" ? "OSM Real Map" : `Grid ${latestRun.grid_size}×${latestRun.grid_size}`}
          {astar?.heuristic ? ` • Heuristic: ${astar.heuristic}` : ""}
        </p>
      </div>

      {notFound ? (
        <div className="px-6 py-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-sm font-bold text-red-600">
            <XCircle className="w-4 h-4" /> Không tìm được đường đi trong lần chạy này
          </div>
          <p className="text-sm text-slate-400 mt-3">Vật cản chặn hoàn toàn đường từ start đến goal.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 flex-1">
        {rows.map((row, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-500 uppercase     r">{row.label}</span>
              <span
                className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${row.winner === "equal"
                    ? "bg-slate-100 text-slate-500"
                    : row.winner === "astar"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}
              >
                {row.improvement}
              </span>
            </div>

            <div className="space-y-2">
              {/* Dijkstra row */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-blue-600 w-16 shrink-0">Dijkstra</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${row.winner === "dijkstra" 
                      ? "bg-gradient-to-r from-blue-400 to-blue-500" 
                      : "bg-gradient-to-r from-blue-300 to-blue-400"}`}
                    style={{ width: `${row.dijkWidth}%` }}
                  />
                </div>
                <span className={`text-sm font-mono font-bold w-20 text-right shrink-0 ${row.winner === "dijkstra" ? "text-blue-600" : "text-slate-700"}`}>
                  {row.dijkVal}
                  {row.winner === "dijkstra" && " ✓"}
                </span>
              </div>

              {/* A* row */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-cyan-600 w-16 shrink-0">A*</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${row.winner === "astar"
                        ? "bg-gradient-to-r from-cyan-400 to-emerald-400"
                        : "bg-gradient-to-r from-cyan-300 to-cyan-400"
                      }`}
                    style={{ width: `${row.astarWidth}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-mono font-bold w-20 text-right shrink-0 ${row.winner === "astar" ? "text-emerald-600" : "text-slate-700"
                    }`}
                >
                  {row.astarVal}
                  {row.winner === "astar" && " ✓"}
                </span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
