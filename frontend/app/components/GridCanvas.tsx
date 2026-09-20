"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { CELL_COLORS } from "@/lib/utils";

interface GridCanvasProps {
  gridSize: number;
  obstacles: Set<string>;
  startPos: [number, number];
  goalPos: [number, number];
  visitedNodes: Set<string>;
  pathNodes: Set<string>;
  label?: string;
  accentColor?: string;
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = useRef(false);
  const lastHoverCellRef = useRef<string | null>(null);

  // Hàm vẽ toàn bộ canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cellW = width / gridSize;
    const cellH = height / gridSize;
    const gap = gridSize <= 30 ? 1 : 0.5;

    // 1. Vẽ nền trắng
    ctx.fillStyle = CELL_COLORS.empty;
    ctx.fillRect(0, 0, width, height);

    // 2. Vẽ Visited
    if (visitedNodes.size > 0) {
      ctx.fillStyle = CELL_COLORS.visited;
      visitedNodes.forEach((key) => {
        const commaIdx = key.indexOf(",");
        const r = parseInt(key.substring(0, commaIdx), 10);
        const c = parseInt(key.substring(commaIdx + 1), 10);
        ctx.fillRect(c * cellW, r * cellH, cellW - gap, cellH - gap);
      });
    }

    // 3. Vẽ Obstacles
    if (obstacles.size > 0) {
      ctx.fillStyle = CELL_COLORS.obstacle;
      obstacles.forEach((key) => {
        const commaIdx = key.indexOf(",");
        const r = parseInt(key.substring(0, commaIdx), 10);
        const c = parseInt(key.substring(commaIdx + 1), 10);
        ctx.fillRect(c * cellW, r * cellH, cellW - gap, cellH - gap);
      });
    }

    // 4. Vẽ Path
    if (pathNodes.size > 0) {
      ctx.fillStyle = CELL_COLORS.path;
      pathNodes.forEach((key) => {
        const commaIdx = key.indexOf(",");
        const r = parseInt(key.substring(0, commaIdx), 10);
        const c = parseInt(key.substring(commaIdx + 1), 10);
        ctx.fillRect(c * cellW, r * cellH, cellW - gap, cellH - gap);
      });
    }

    // 5. Vẽ lưới viền (Grid lines)
    if (gridSize <= 50) {
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= gridSize; i++) {
        const pos = Math.round(i * cellW);
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, height);
        ctx.moveTo(0, pos);
        ctx.lineTo(width, pos);
      }
      ctx.stroke();
    }

    // 6. Vẽ Start Pos
    const [sr, sc] = startPos;
    ctx.fillStyle = CELL_COLORS.start;
    ctx.fillRect(sc * cellW, sr * cellH, cellW - gap, cellH - gap);
    const sCenterX = sc * cellW + cellW / 2;
    const sCenterY = sr * cellH + cellH / 2;
    const radius = Math.max(2, Math.min(cellW, cellH) * 0.3);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sCenterX, sCenterY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 7. Vẽ Goal Pos
    const [gr, gc] = goalPos;
    ctx.fillStyle = CELL_COLORS.goal;
    ctx.fillRect(gc * cellW, gr * cellH, cellW - gap, cellH - gap);
    const gCenterX = gc * cellW + cellW / 2;
    const gCenterY = gr * cellH + cellH / 2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(gCenterX, gCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
  }, [gridSize, obstacles, visitedNodes, pathNodes, startPos, goalPos]);

  // Cập nhật kích thước canvas theo container với HiDPI
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height || rect.width);
    if (size <= 0) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const targetSize = Math.floor(size * dpr);

    if (canvas.width !== targetSize || canvas.height !== targetSize) {
      canvas.width = targetSize;
      canvas.height = targetSize;
    }

    renderCanvas();
  }, [renderCanvas]);

  // Observer resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    updateCanvasSize();
    return () => resizeObserver.disconnect();
  }, [updateCanvasSize]);

  // Vẽ lại khi state thay đổi
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Tọa độ chuột sang cell (r, c)
  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellW = rect.width / gridSize;
    const cellH = rect.height / gridSize;
    const c = Math.floor(x / cellW);
    const r = Math.floor(y / cellH);
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      return [r, c];
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    isMouseDownRef.current = true;
    onMouseDown?.();
    const cell = getCellFromEvent(e);
    if (cell) {
      lastHoverCellRef.current = `${cell[0]},${cell[1]}`;
      onCellClick?.(cell[0], cell[1]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const key = `${cell[0]},${cell[1]}`;
    if (key !== lastHoverCellRef.current) {
      lastHoverCellRef.current = key;
      if (isMouseDownRef.current) {
        onCellMouseEnter?.(cell[0], cell[1]);
      }
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    lastHoverCellRef.current = null;
    onMouseUp?.();
  };

  const handleMouseLeave = () => {
    isMouseDownRef.current = false;
    lastHoverCellRef.current = null;
    onMouseLeave?.();
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      {label && (
        <div className="flex items-center gap-2 mb-3 self-start w-full">
          <span className={`w-2.5 h-2.5 rounded-full ${accentColor || "bg-indigo-500"}`}></span>
          <span className="text-sm font-bold text-slate-700">{label}</span>
          {visitedNodes.size > 0 && (
            <span className="text-[13px] text-slate-400 font-mono ml-auto">
              Duyệt: {visitedNodes.size} | Đường: {pathNodes.size}
            </span>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full h-full aspect-square flex items-center justify-center select-none ${
          interactive ? "cursor-crosshair" : "cursor-default"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
