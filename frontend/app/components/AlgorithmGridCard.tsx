"use client";

import React from "react";
import GridCanvas from "./GridCanvas";
import { formatNumber } from "@/lib/utils";
import { CheckCircle2, Loader2, CircleDashed, XCircle } from "lucide-react";

interface AlgorithmGridCardProps {
  title: string;
  subtitle: string;
  colorTheme: "blue" | "cyan";
  nodesCount: number | null;
  status: "ready" | "running" | "completed";
  progress: number; // 0 - 100
  found?: boolean | null; // null = chưa chạy, true/false = kết quả

  // Grid Canvas props
  gridSize: number;
  obstacles: Set<string>;
  startPos: [number, number];
  goalPos: [number, number];
  visitedNodes: Set<string>;
  pathNodes: Set<string>;

  // Interactions
  interactive: boolean;
  onCellClick?: (r: number, c: number) => void;
  onCellMouseEnter?: (r: number, c: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
}

export default function AlgorithmGridCard({
  title, subtitle, colorTheme, nodesCount, status, progress, found,
  gridSize, obstacles, startPos, goalPos, visitedNodes, pathNodes,
  interactive, onCellClick, onCellMouseEnter, onMouseDown, onMouseUp, onMouseLeave
}: AlgorithmGridCardProps) {
  const isBlue = colorTheme === "blue";
  const themeColors = isBlue
    ? { title: "text-blue-600", bg: "bg-blue-500", lightBg: "bg-blue-50", border: "border-blue-100", progress: "bg-blue-500" }
    : { title: "text-cyan-600", bg: "bg-cyan-500", lightBg: "bg-cyan-50", border: "border-cyan-100", progress: "bg-cyan-500" };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <h3 className={`text-base sm:text-lg font-bold uppercase flex items-center gap-2 ${themeColors.title}`}>
            {title}
            {nodesCount !== null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-700 normal-case">{formatNumber(nodesCount)} nút</span>
              </>
            )}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {status === "ready" && (
            <span className="text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              <CircleDashed className="w-3.5 h-3.5" /> Sẵn sàng
            </span>
          )}
          {status === "running" && (
            <span className="text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tìm... {progress}%
            </span>
          )}
          {status === "completed" && found !== false && (
            <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
            </span>
          )}
          {status === "completed" && found === false && (
            <span className="text-red-600 flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <XCircle className="w-3.5 h-3.5" /> Không có đường đi
            </span>
          )}
        </div>
      </div>

      {/* Grid Area - Bung to chiếm trọn chiều rộng của Card */}
      <div className="flex-1 flex justify-center items-center bg-slate-50/50 rounded-xl border border-slate-100 p-2 sm:p-3 w-full">
        <div className="w-full aspect-square relative shadow-sm rounded-lg overflow-hidden border border-slate-200/60 bg-white">
          <GridCanvas
            gridSize={gridSize}
            obstacles={obstacles}
            startPos={startPos}
            goalPos={goalPos}
            visitedNodes={visitedNodes}
            pathNodes={pathNodes}
            label=""
            accentColor={themeColors.bg}
            onCellClick={onCellClick}
            onCellMouseEnter={onCellMouseEnter}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            interactive={interactive}
          />
          {/* No-path overlay: hiển thị khi thuật toán không tìm được đường */}
          {found === false && status === "completed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/85 backdrop-blur-[1px] animate-in fade-in duration-300">
              <XCircle className="w-9 h-9 text-red-400 mb-1.5" />
              <p className="text-red-600 font-bold text-xs text-center px-4">
                Không tìm được đường đi
              </p>
              <p className="text-red-400 text-[11px] text-center px-6 mt-0.5">
                Vật cản chặn hoàn toàn đường đến đích
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
