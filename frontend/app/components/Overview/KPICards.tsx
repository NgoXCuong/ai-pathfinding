"use client";
import React, { useMemo } from "react";
import { TrendingUp, Zap, Target, Clock } from "lucide-react";
import type { HistoryItem } from "@/lib/types";

interface KPICardsProps {
  historyList: HistoryItem[];
}

export default function KPICards({ historyList }: KPICardsProps) {
  const stats = useMemo(() => {
    if (historyList.length === 0) return null;

    const allAstar = historyList
      .flatMap((h) => h.results || [])
      .filter((r) => r.algorithm === "astar");
    const allDijk = historyList
      .flatMap((h) => h.results || [])
      .filter((r) => r.algorithm === "dijkstra");

    const avgAstarTime =
      allAstar.reduce((s, r) => s + (r.execution_time || 0), 0) /
      (allAstar.length || 1);
    const avgDijkTime =
      allDijk.reduce((s, r) => s + (r.execution_time || 0), 0) /
      (allDijk.length || 1);
    const avgImprovement =
      avgDijkTime > 0
        ? (((avgDijkTime - avgAstarTime) / avgDijkTime) * 100).toFixed(1)
        : "0";

    const totalNodes = allAstar.reduce((s, r) => s + (r.nodes_visited || 0), 0);
    const avgNodes = Math.round(totalNodes / (allAstar.length || 1));

    return {
      totalRuns: historyList.length,
      avgAstarTime,
      avgImprovement: Number(avgImprovement),
      avgNodes,
    };
  }, [historyList]);

  const cards = [
    {
      label: "Tổng thực nghiệm",
      value: stats ? stats.totalRuns.toString() : "—",
      sub: "Đã hoàn thành",
      icon: <Target className="w-5 h-5" />,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "A* Trung bình",
      value: stats
        ? stats.avgAstarTime < 1
          ? `${(stats.avgAstarTime * 1000).toFixed(2)} µs`
          : `${stats.avgAstarTime.toFixed(2)} ms`
        : "—",
      sub: "Thời gian thực thi",
      icon: <Zap className="w-5 h-5" />,
      color: "cyan",
      gradient: "from-cyan-500 to-cyan-600",
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-100",
    },
    {
      label: "Hiệu suất A*",
      value: stats ? `+${stats.avgImprovement}%` : "—",
      sub: "So với Dijkstra",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    {
      label: "Node trung bình",
      value: stats
        ? stats.avgNodes > 1000
          ? `${(stats.avgNodes / 1000).toFixed(1)}k`
          : stats.avgNodes.toString()
        : "—",
      sub: "Duyệt mỗi lần chạy",
      icon: <Clock className="w-5 h-5" />,
      color: "violet",
      gradient: "from-violet-500 to-violet-600",
      bg: "bg-violet-50",
      text: "text-violet-600",
      border: "border-violet-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`relative bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
        >
          {/* Gradient accent */}
          <div
            className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-linear-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={`inline-flex p-2 rounded-lg ${card.bg} ${card.text}`}
              >
                {card.icon}
              </div>
              <div className="text-[16px] font-bold text-slate-700 uppercase   ">
                {card.label}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-slate-800    leading-none">
                {card.value}
              </div>
              <div className="text-sm font-medium text-slate-400">
                {card.sub}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
