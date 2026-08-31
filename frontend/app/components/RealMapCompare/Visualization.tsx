import React from "react";
import dynamic from "next/dynamic";
import { Clock } from "lucide-react";
import type { RealCompareResult } from "@/lib/types";

const MapView = dynamic(() => import("../Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
      <Clock className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-3 text-slate-500 font-medium">Đang tải bản đồ...</span>
    </div>
  ),
});

interface VisualizationProps {
  realStart: { lat: number; lon: number } | null;
  realGoal: { lat: number; lon: number } | null;
  handleMapClick: (lat: number, lon: number) => void;
  isAnimationComplete: boolean;
  result: RealCompareResult | null;
  animationProgress: number;
  heuristic: string;
}

export default function Visualization({
  realStart, realGoal, handleMapClick, isAnimationComplete,
  result, animationProgress, heuristic
}: VisualizationProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dijkstra Map */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative z-0">
        <div className="mb-3 px-2 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-blue-600 uppercase">DIJKSTRA</h3>
            <p className="text-sm text-slate-500 font-medium">Thuật toán mù (Không sử dụng heuristic)</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 min-h-[500px]">
          <MapView
            start={realStart}
            goal={realGoal}
            onMapClick={handleMapClick}
            path={isAnimationComplete ? result?.dijkstra?.path_coords : undefined}
            visitedNodes={result?.dijkstra?.visited_coords?.slice(0, animationProgress)}
            visitedColor="#60a5fa" // blue-400
            pathColor="#9333ea" // purple-600
          />
        </div>
      </div>

      {/* A* Map */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative z-0">
        <div className="mb-3 px-2 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-cyan-600 uppercase">A*</h3>
            <p className="text-sm text-slate-500 font-medium">Heuristic: {heuristic.charAt(0).toUpperCase() + heuristic.slice(1)}</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 min-h-[500px]">
          <MapView
            start={realStart}
            goal={realGoal}
            onMapClick={handleMapClick}
            path={isAnimationComplete ? result?.astar?.path_coords : undefined}
            visitedNodes={result?.astar?.visited_coords?.slice(0, animationProgress)}
            visitedColor="#22d3ee" // cyan-400
            pathColor="#e11d48" // rose-600
            isDashed={true}
          />
        </div>
      </div>
    </div>
  );
}
