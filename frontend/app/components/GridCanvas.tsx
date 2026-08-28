"use client";

import React from "react";
import { CELL_COLORS } from "@/lib/utils";

interface GridCanvasProps {
  gridSize: number;
  obstacles: Set<string>;
  startPos: [number, number];
  goalPos: [number, number];
  visitedNodes: Set<string>;
  pathNodes: Set<string>;
  label: string;
  accentColor: string;
  onCellClick?: (r: number, c: number) => void;
  onCellMouseEnter?: (r: number, c: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  interactive?: boolean;
}

export default function GridCanvas({
  gridSize,
  obstacles,
  startPos,
  goalPos,
  visitedNodes,
  pathNodes,
  label,
  accentColor,
  onCellClick,
  onCellMouseEnter,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  interactive = false,
}: GridCanvasProps) {
  return (
    <div className="w-full flex justify-center items-center h-full">
      {label && (
        <div className="flex items-center gap-2 mb-3 self-start w-full">
          <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`}></span>
          <span className="text-sm font-bold text-slate-700">{label}</span>
          {visitedNodes.size > 0 && (
            <span className="text-[13px] text-slate-400 font-mono ml-auto">
              Duyệt: {visitedNodes.size} | Đường: {pathNodes.size}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        className={`grid gap-px select-none ${interactive ? "cursor-pointer" : ""}`}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          width: "100%",
          maxHeight: "100%",
          aspectRatio: "1/1",
        }}
      >
        {Array.from({ length: gridSize }).map((_, r) =>
          Array.from({ length: gridSize }).map((_, c) => {
            const key = `${r},${c}`;
            const isStart = r === startPos[0] && c === startPos[1];
            const isGoal = r === goalPos[0] && c === goalPos[1];
            const isObs = obstacles.has(key);
            const isPath = pathNodes.has(key);
            const isVisited = visitedNodes.has(key);

            let bgColor = CELL_COLORS.empty;
            if (isStart) bgColor = CELL_COLORS.start;
            else if (isGoal) bgColor = CELL_COLORS.goal;
            else if (isObs) bgColor = CELL_COLORS.obstacle;
            else if (isPath) bgColor = CELL_COLORS.path;
            else if (isVisited) bgColor = CELL_COLORS.visited;

            return (
              <div
                key={key}
                onClick={() => onCellClick?.(r, c)}
                onMouseEnter={() => onCellMouseEnter?.(r, c)}
                style={{ backgroundColor: bgColor }}
                className="aspect-square rounded-[1px] transition-colors duration-100 border border-slate-200/50 hover:brightness-110"
              />
            );
          })
        )}
      </div>
    </div>
  );
}
