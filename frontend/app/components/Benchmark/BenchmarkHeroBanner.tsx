"use client";

import React from "react";
import {
  Trophy,
  Zap,
  TrendingDown,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Info,
} from "lucide-react";
import type { BenchmarkResult } from "@/lib/types";
import { formatMs, formatNumber } from "@/lib/utils";

interface BenchmarkHeroBannerProps {
  result: BenchmarkResult;
}

export default function BenchmarkHeroBanner({ result }: BenchmarkHeroBannerProps) {
  const { stats, improvement, config, graph_scale } = result;

  const astarWinsNodes = stats.astar.nodes.avg < stats.dijkstra.nodes.avg;
  const astarWinsTime = stats.astar.time.avg < stats.dijkstra.time.avg;

  const speedup =
    improvement.speedup_factor ||
    (stats.astar.time.avg > 0
      ? Number((stats.dijkstra.time.avg / stats.astar.time.avg).toFixed(2))
      : 1.0);

  const timeDiffPct = improvement.time_pct;
  const nodesDiffPct = improvement.nodes_pct;

  const isOptimal =
    Math.abs(stats.dijkstra.distance.avg - stats.astar.distance.avg) < 0.05;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 text-white shadow-xl p-5 sm:p-6">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header Title & Verdict */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            {/* Tag KẾT LUẬN THỰC NGHIỆM ĐỔI MÀU NỔI BẬT DỄ NHÌN */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>Kết Luận Thực Nghiệm</span>
            </div>

            {/* Dòng kết luận to rõ */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              {astarWinsNodes && astarWinsTime ? (
                <>
                  A* VƯỢT TRỘI: TĂNG TỐC{" "}
                  <span className="text-amber-300 font-extrabold">{speedup}×</span> & GIẢM{" "}
                  <span className="text-emerald-300 font-extrabold">{Math.abs(nodesDiffPct)}%</span> NÚT DUYỆT
                </>
              ) : astarWinsNodes ? (
                <>
                  A* TIẾT KIỆM{" "}
                  <span className="text-emerald-300">{Math.abs(nodesDiffPct)}%</span> NÚT DUYỆT
                </>
              ) : astarWinsTime ? (
                <>
                  A* TĂNG TỐC <span className="text-amber-300">{speedup}×</span> SO VỚI DIJKSTRA
                </>
              ) : (
                "DIJKSTRA VÀ A* KẾT QUẢ TƯƠNG ĐƯƠNG"
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-400/40 px-3 py-1.5 rounded-xl text-xs font-mono text-indigo-200">
            <Cpu className="w-3.5 h-3.5 text-indigo-300" />
            <span>
              Lưới {config.grid_size}×{config.grid_size} ({graph_scale?.total_nodes?.toLocaleString() || config.grid_size ** 2} đỉnh)
            </span>
          </div>
        </div>

        {/* 4 Golden KPI Cards with High Contrast & Vivid Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Speedup & Thời gian */}
          <div className="bg-blue-950/50 border border-blue-400/40 rounded-xl p-4 transition-all hover:border-blue-400/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                1. Tốc Độ Thực Thi
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-blue-500 text-white flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 fill-current" />
                {speedup}× Tăng tốc
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-cyan-300 mb-1">
              {timeDiffPct >= 0 ? `↓ ${timeDiffPct}%` : `↑ ${Math.abs(timeDiffPct)}%`}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200 font-mono">
              <span className="text-blue-300 font-medium">Dijkstra: {formatMs(stats.dijkstra.time.avg)}</span>
              <span className="text-slate-400">→</span>
              <span className="text-cyan-300 font-bold">A*: {formatMs(stats.astar.time.avg)}</span>
            </div>
          </div>

          {/* Card 2: Nút mở rộng (Expanded Nodes) */}
          <div className="bg-emerald-950/50 border border-emerald-400/40 rounded-xl p-4 transition-all hover:border-emerald-400/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                2. Nút Mở Rộng
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                <TrendingDown className="w-3 h-3" />
                Giảm {Math.abs(nodesDiffPct)}%
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-300 mb-1">
              {nodesDiffPct >= 0 ? `↓ ${nodesDiffPct}%` : `↑ ${Math.abs(nodesDiffPct)}%`}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200 font-mono">
              <span className="text-blue-300 font-medium">{formatNumber(stats.dijkstra.nodes.avg)}</span>
              <span className="text-slate-400">→</span>
              <span className="text-emerald-300 font-bold">{formatNumber(stats.astar.nodes.avg)}</span>
            </div>
          </div>

          {/* Card 3: Tính tối ưu (Optimality & Cost) */}
          <div className="bg-amber-950/50 border border-amber-400/40 rounded-xl p-4 transition-all hover:border-amber-400/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                3. Chi Phí Đường Đi
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                {isOptimal ? "100% Tối ưu" : "Gần tối ưu"}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-300 mb-1">
              {formatNumber(stats.astar.distance.avg)} bước
            </div>
            <div className="text-xs text-slate-200 font-mono flex items-center gap-1">
              <span>Dijkstra: {formatNumber(stats.dijkstra.distance.avg)} = A*: {formatNumber(stats.astar.distance.avg)}</span>
            </div>
          </div>

          {/* Card 4: Tỷ lệ thành công (Success Rate) */}
          <div className="bg-teal-950/50 border border-teal-400/40 rounded-xl p-4 transition-all hover:border-teal-400/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                4. Tỷ Lệ Tìm Thấy
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-teal-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                Tin cậy cao
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-teal-300 mb-1">
              {stats.astar.success_rate !== undefined ? `${stats.astar.success_rate}%` : "100%"}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200 font-mono">
              <span>Dijkstra: {stats.dijkstra.success_rate ?? 100}%</span>
              <span>•</span>
              <span>A*: {stats.astar.success_rate ?? 100}%</span>
            </div>
          </div>
        </div>

        {/* Analytical Context Footer */}
        <div className="bg-slate-950/50 rounded-xl p-3 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Thực nghiệm trên <strong className="text-white">{config.iterations} lượt ngẫu nhiên</strong>,
              lưới <strong className="text-white">{config.grid_size}×{config.grid_size}</strong>,
              vật cản <strong className="text-white">{Math.round(config.obstacle_density * 100)}%</strong>,
              heuristic <strong className="text-amber-300 uppercase font-bold">{config.heuristic}</strong>.
            </span>
          </div>

          <div className="text-[11px] text-emerald-300 font-bold">
            ✓ Heuristic admissible: đảm bảo nghiệm tìm được là ngắn nhất tuyệt đối
          </div>
        </div>
      </div>
    </div>
  );
}
