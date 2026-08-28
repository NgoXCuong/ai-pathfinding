"use client";
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, TrendingDown, Equal } from "lucide-react";
import type { HistoryItem } from "@/lib/types";
import { formatMs, formatNumber } from "@/lib/utils";

interface AlgorithmInsightProps {
  historyList: HistoryItem[];
}

export default function AlgorithmInsight({ historyList }: AlgorithmInsightProps) {
  const data = useMemo(() => {
    if (historyList.length === 0) return null;

    const allAstar = historyList.flatMap((h) => h.results || []).filter((r) => r.algorithm === "astar");
    const allDijk = historyList.flatMap((h) => h.results || []).filter((r) => r.algorithm === "dijkstra");

    const avgAstarTime = allAstar.reduce((s, r) => s + (r.execution_time || 0), 0) / (allAstar.length || 1);
    const avgDijkTime = allDijk.reduce((s, r) => s + (r.execution_time || 0), 0) / (allDijk.length || 1);
    const avgAstarNodes = Math.round(allAstar.reduce((s, r) => s + (r.nodes_visited || 0), 0) / (allAstar.length || 1));
    const avgDijkNodes = Math.round(allDijk.reduce((s, r) => s + (r.nodes_visited || 0), 0) / (allDijk.length || 1));

    const timeDiff = avgDijkTime - avgAstarTime;
    const timeImp = Math.abs(timeDiff) > 0.001
      ? (Math.abs(timeDiff) / Math.max(avgDijkTime, avgAstarTime)) * 100
      : 0;
    const timeWinner = Math.abs(timeDiff) <= 0.001 ? "equal" : timeDiff > 0 ? "astar" : "dijkstra";

    const nodeDiff = avgDijkNodes - avgAstarNodes;
    const nodeImp = Math.abs(nodeDiff) > 0
      ? (Math.abs(nodeDiff) / Math.max(avgDijkNodes, avgAstarNodes)) * 100
      : 0;
    const nodeWinner = Math.abs(nodeDiff) === 0 ? "equal" : nodeDiff > 0 ? "astar" : "dijkstra";

    // Phân phối môi trường
    const gridCount = historyList.filter((h) => h.map_type === "grid").length;
    const osmCount = historyList.filter((h) => h.map_type === "osm").length;

    // Win rate: bao nhiêu lần A* nhanh hơn
    let astarWins = 0;
    historyList.forEach((h) => {
      const astar = (h.results || []).find((r) => r.algorithm === "astar");
      const dijk = (h.results || []).find((r) => r.algorithm === "dijkstra");
      if (astar && dijk && (astar.execution_time || 0) < (dijk.execution_time || 0)) astarWins++;
    });
    const astarWinRate = Math.round((astarWins / historyList.length) * 100);

    return {
      avgAstarTime, avgDijkTime,
      avgAstarNodes, avgDijkNodes,
      timeImp, timeWinner,
      nodeImp, nodeWinner,
      gridCount, osmCount,
      astarWinRate,
      totalRuns: historyList.length,
    };
  }, [historyList]);

  if (!data) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <Brain className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-400">Chưa có dữ liệu phân tích</p>
        </CardContent>
      </Card>
    );
  }

  const winRateDeg = (data.astarWinRate / 100) * 283; // stroke-dasharray trick for 90px circle

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Thông tin chi tiết về hiệu suất AI</h3>
          </div>
          <span className="text-[13px] font-bold uppercase    text-slate-400 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
            {data.totalRuns} Runs
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* Win Rate Circle */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={data.astarWinRate >= 50 ? "#10b981" : "#f59e0b"}
                  strokeWidth="3"
                  strokeDasharray={`${(data.astarWinRate / 100) * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800">{data.astarWinRate}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-700 leading-snug">
                A* nhanh hơn Dijkstra trong <span className="text-emerald-600">{data.astarWinRate}%</span> các thực nghiệm
              </p>
              <p className="text-sm text-slate-400 mt-1">Grid: {data.gridCount} | OSM Map: {data.osmCount}</p>
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="space-y-3">
            {/* Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-bold uppercase text-slate-500">Runtime Trung bình</span>
                {data.timeWinner === "astar" ? (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-emerald-600">
                    <TrendingDown className="w-3 h-3" /> A* nhanh hơn {data.timeImp.toFixed(1)}%
                  </span>
                ) : data.timeWinner === "dijkstra" ? (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-blue-600">
                    <TrendingDown className="w-3 h-3" /> Dijk nhanh hơn {data.timeImp.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-slate-500">
                    <Equal className="w-3 h-3" /> Tương đương
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] w-14 text-slate-500 font-semibold">A*</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((data.avgAstarTime / (data.avgDijkTime || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-mono font-bold text-slate-700 w-16 text-right">{formatMs(data.avgAstarTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] w-14 text-slate-500 font-semibold">Dijkstra</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-full transition-all duration-500" />
                  </div>
                  <span className="text-[13px] font-mono font-bold text-slate-700 w-16 text-right">{formatMs(data.avgDijkTime)}</span>
                </div>
              </div>
            </div>

            {/* Nodes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-bold uppercase text-slate-500">Nodes Duyệt TB</span>
                {data.nodeWinner === "astar" ? (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-emerald-600">
                    <TrendingDown className="w-3 h-3" /> A* ít hơn {data.nodeImp.toFixed(1)}%
                  </span>
                ) : data.nodeWinner === "dijkstra" ? (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-blue-600">
                    <TrendingDown className="w-3 h-3" /> Dijk ít hơn {data.nodeImp.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[13px] font-bold text-slate-500">
                    <Equal className="w-3 h-3" /> Tương đương
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] w-14 text-slate-500 font-semibold">A*</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((data.avgAstarNodes / (data.avgDijkNodes || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-mono font-bold text-slate-700 w-16 text-right">{formatNumber(data.avgAstarNodes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] w-14 text-slate-500 font-semibold">Dijkstra</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-full transition-all duration-500" />
                  </div>
                  <span className="text-[13px] font-mono font-bold text-slate-700 w-16 text-right">{formatNumber(data.avgDijkNodes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
