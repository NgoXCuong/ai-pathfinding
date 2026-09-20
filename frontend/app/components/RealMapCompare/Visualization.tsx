import React from "react";
import dynamic from "next/dynamic";
import { Clock, CheckCircle2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RealCompareResult } from "@/lib/types";

const MapView = dynamic(() => import("../Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[580px] w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
      <Clock className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-3 text-slate-500 font-medium">Đang tải bản đồ...</span>
    </div>
  ),
});

interface VisualizationProps {
  realStart: { lat: number; lon: number } | null;
  realGoal: { lat: number; lon: number } | null;
  handleMapClick: (lat: number, lon: number) => void;
  result: RealCompareResult | null;
  heuristic: string;
  dijkstraVisitedCount: number;
  isDijkstraPathVisible: boolean;
  astarVisitedCount: number;
  isAstarPathVisible: boolean;
}

export default function Visualization({
  realStart,
  realGoal,
  handleMapClick,
  result,
  heuristic,
  dijkstraVisitedCount,
  isDijkstraPathVisible,
  astarVisitedCount,
  isAstarPathVisible,
}: VisualizationProps) {
  const dijkstraTotal = result?.dijkstra?.visited_coords?.length || 0;
  const astarTotal = result?.astar?.visited_coords?.length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      {/* Dijkstra Map */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col relative z-0">
        <div className="mb-2.5 px-1.5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-blue-600 uppercase">DIJKSTRA</h3>
              {result && (
                isDijkstraPathVisible ? (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã tìm thấy đích ({dijkstraTotal} nodes)
                  </Badge>
                ) : dijkstraVisitedCount > 0 ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1 animate-pulse">
                    <Activity className="w-3 h-3" /> Đang duyệt: {dijkstraVisitedCount} / {dijkstraTotal}
                  </Badge>
                ) : null
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Thuật toán mù (Không sử dụng heuristic định hướng)</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 h-[calc(100vh-275px)] min-h-[580px] xl:min-h-[660px]">
          <MapView
            start={realStart}
            goal={realGoal}
            onMapClick={handleMapClick}
            path={isDijkstraPathVisible ? result?.dijkstra?.path_coords : undefined}
            visitedNodes={result?.dijkstra?.visited_coords?.slice(0, dijkstraVisitedCount)}
            visitedColor="#60a5fa" // blue-400
            pathColor="#9333ea" // purple-600
          />
        </div>
      </div>

      {/* A* Map */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col relative z-0">
        <div className="mb-2.5 px-1.5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-cyan-600 uppercase">A*</h3>
              {result && (
                isAstarPathVisible ? (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã tìm thấy đích ({astarTotal} nodes)
                  </Badge>
                ) : astarVisitedCount > 0 ? (
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs flex items-center gap-1 animate-pulse">
                    <Activity className="w-3 h-3" /> Đang duyệt: {astarVisitedCount} / {astarTotal}
                  </Badge>
                ) : null
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Heuristic: {heuristic.charAt(0).toUpperCase() + heuristic.slice(1)} (Khoảng cách chim bay)
            </p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 h-[calc(100vh-275px)] min-h-[580px] xl:min-h-[660px]">
          <MapView
            start={realStart}
            goal={realGoal}
            onMapClick={handleMapClick}
            path={isAstarPathVisible ? result?.astar?.path_coords : undefined}
            visitedNodes={result?.astar?.visited_coords?.slice(0, astarVisitedCount)}
            visitedColor="#22d3ee" // cyan-400
            pathColor="#e11d48" // rose-600
            isDashed={true}
          />
        </div>
      </div>
    </div>
  );
}
