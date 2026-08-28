"use client";
import React from "react";
import { formatMs, formatNumber } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import type { TabId } from "../Sidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, Route, RotateCcw,
  MapPin, Grid3X3, Clock, Network, Milestone, ArrowDown, Equal, ArrowUp,
} from "lucide-react";

interface HeroExperimentProps {
  latestRun?: HistoryItem;
  setActiveTab: (tab: TabId) => void;
}

export default function HeroExperiment({ latestRun, setActiveTab }: HeroExperimentProps) {
  /* ── Empty state ───────────────────────────────────────── */
  if (!latestRun?.results) {
    return (
      <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center mb-5 bg-white shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Route className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có dữ liệu thực nghiệm</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs">
          Chạy một thực nghiệm so sánh để bắt đầu theo dõi hiệu năng của các thuật toán.
        </p>
        <Button
          onClick={() => setActiveTab("compare")}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20"
        >
          Chạy thực nghiệm <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  /* ── Data extraction ───────────────────────────────────── */
  const astar = latestRun.results.find((r) => r.algorithm === "astar") || latestRun.results[0];
  const dijkstra = latestRun.results.find((r) => r.algorithm === "dijkstra") || latestRun.results[0];
  const isOsm = latestRun.map_type === "osm";
  const envName = isOsm ? "OSM Real Map" : `Grid ${latestRun.grid_size}×${latestRun.grid_size}`;

  const astarTime = astar?.execution_time || 0;
  const dijkTime = dijkstra?.execution_time || 0;
  const astarNodes = astar?.nodes_visited || 0;
  const dijkNodes = dijkstra?.nodes_visited || 0;

  const nodeImp = dijkNodes > 0 && dijkNodes > astarNodes
    ? ((dijkNodes - astarNodes) / dijkNodes * 100).toFixed(1) : null;
  const timeImp = dijkTime > 0 && dijkTime > astarTime
    ? ((dijkTime - astarTime) / dijkTime * 100).toFixed(1) : null;

  const maxTime = Math.max(astarTime, dijkTime, 0.0001);
  const maxNodes = Math.max(astarNodes, dijkNodes, 1);

  /* ── KPI trio (same style as ComparisonResults) ────────── */
  const kpis = [
    {
      label: "Nút Đã Duyệt",
      icon: <Network className="w-4 h-4" />,
      dijkVal: formatNumber(dijkNodes),
      astarVal: formatNumber(astarNodes),
      winner: astarNodes <= dijkNodes ? "astar" : "dijkstra",
      badge: nodeImp ? `↓ ${nodeImp}%` : null,
      dijkWidth: (dijkNodes / maxNodes) * 100,
      astarWidth: (astarNodes / maxNodes) * 100,
    },
    {
      label: "Thời Gian",
      icon: <Clock className="w-4 h-4" />,
      dijkVal: formatMs(dijkTime),
      astarVal: formatMs(astarTime),
      winner: astarTime <= dijkTime ? "astar" : "dijkstra",
      badge: timeImp ? `↓ ${timeImp}%` : null,
      dijkWidth: (astarTime / maxTime) * 100,   // smaller bar = faster
      astarWidth: (dijkTime / maxTime) * 100,   // note: inverted intentionally for visual
    },
    {
      label: "Số Bước Đường",
      icon: <Milestone className="w-4 h-4" />,
      dijkVal: String(dijkstra?.steps || 0),
      astarVal: String(astar?.steps || 0),
      winner: (astar?.steps || 0) === (dijkstra?.steps || 0) ? "equal" : (astar?.steps || 0) < (dijkstra?.steps || 0) ? "astar" : "dijkstra",
      badge: (astar?.steps || 0) === (dijkstra?.steps || 0) ? "✓ Tối ưu chung" : null,
      dijkWidth: 100,
      astarWidth: 100,
    },
  ] as const;

  return (
    <div className="mb-5">
      {/* ── Top bar header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl text-white">
        <div className="flex items-center gap-3">
          {isOsm
            ? <MapPin className="w-4 h-4 text-cyan-400" />
            : <Grid3X3 className="w-4 h-4 text-cyan-400" />
          }
          <span className="font-bold text-sm">{envName}</span>
          {astar?.heuristic && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 text-sm font-medium capitalize">
                Heuristic: {astar.heuristic}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[13px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Completed
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => setActiveTab("compare")}
            className="h-8 text-sm border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Chạy lại
          </Button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="bg-slate-50/50 border border-t-0 border-slate-200 rounded-b-2xl shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── KPI cards (same style as ComparisonResults) ── */}
          {kpis.map((kpi, i) => {
            const astarWins = kpi.winner === "astar";
            const isEqual = kpi.winner === "equal";
            return (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 uppercase     r mb-4">
                  {kpi.icon} {kpi.label}
                </div>

                {/* Versus row */}
                <div className="flex justify-center items-center gap-5 mb-4">
                  <div className="text-center">
                    <div className="text-[13px] text-blue-600 font-bold mb-1">Dijkstra</div>
                    <div className="text-xl font-bold text-slate-800">{kpi.dijkVal}</div>
                  </div>
                  <div className="text-slate-300">
                    {isEqual
                      ? <Equal className="w-5 h-5 text-emerald-500" />
                      : astarWins
                        ? <ArrowDown className="w-5 h-5 text-emerald-500" />
                        : <ArrowUp className="w-5 h-5 text-red-500" />
                    }
                  </div>
                  <div className="text-center">
                    <div className="text-[13px] text-cyan-600 font-bold mb-1">A*</div>
                    <div className={`text-xl font-bold ${astarWins ? "text-emerald-600" : "text-slate-800"}`}>
                      {kpi.astarVal}
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                {!isEqual && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] w-10 text-blue-500 font-bold text-right">Dijk</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${kpi.dijkWidth}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] w-10 text-cyan-500 font-bold text-right">A*</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full ${astarWins ? "bg-gradient-to-r from-cyan-400 to-emerald-400" : "bg-cyan-400"}`}
                          style={{ width: `${kpi.astarWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {kpi.badge && (
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold ${isEqual
                      ? "bg-emerald-50 text-emerald-700"
                      : astarWins
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                    {kpi.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Insight box (same style as ComparisonResults) ── */}
        <div className="mx-6 mb-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg shrink-0 mt-0.5">
            <Route className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h5 className="font-bold text-blue-900 mb-1 text-sm">Insight Phân Tích — Lần chạy gần nhất</h5>
            <p className="text-blue-800 text-sm leading-relaxed">
              {nodeImp
                ? <>Trong môi trường <strong>{envName}</strong>, A* duyệt ít hơn <strong>{nodeImp}%</strong> số node so với Dijkstra
                  {timeImp ? <> và chạy nhanh hơn <strong>{timeImp}%</strong></> : ""}
                  , nhờ sử dụng heuristic <strong className="capitalize">{astar?.heuristic || "mặc định"}</strong> để định hướng tìm kiếm.</>
                : <>Trong thực nghiệm này, A* và Dijkstra có hiệu suất tương đương nhau — điều này thường xảy ra với bản đồ thưa hoặc cấu trúc vật cản đặc biệt.</>
              }
            </p>
          </div>
        </div>

        {/* ── OSM coordinate info (chỉ hiện nếu OSM) ────────── */}
        {isOsm && (latestRun.start_lat || latestRun.end_lat) && (
          <div className="mx-6 mb-6 grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <div className="text-[13px] font-bold uppercase     r text-slate-400">Điểm xuất phát</div>
                <div className="text-sm font-mono font-semibold text-slate-700">
                  {latestRun.start_lat?.toFixed(5)}, {latestRun.start_lon?.toFixed(5)}
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-red-50 rounded-lg shrink-0">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div>
                <div className="text-[13px] font-bold uppercase     r text-slate-400">Điểm đích</div>
                <div className="text-sm font-mono font-semibold text-slate-700">
                  {latestRun.end_lat?.toFixed(5)}, {latestRun.end_lon?.toFixed(5)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Check marks ─────────────────────────────────── */}
        <div className="px-6 pb-5 flex flex-wrap gap-4">
          {timeImp && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              A* nhanh hơn <strong className="text-emerald-600 ml-0.5">{timeImp}%</strong>
            </div>
          )}
          {nodeImp && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Duyệt ít hơn <strong className="text-emerald-600 ml-0.5">{nodeImp}%</strong> node
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Đường đi tối ưu được tìm thấy
          </div>
        </div>
      </div>
    </div>
  );
}
