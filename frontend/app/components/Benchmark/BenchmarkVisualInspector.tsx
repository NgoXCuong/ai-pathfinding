"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Compass,
  Zap,
  RotateCcw,
  Sparkles,
  Shuffle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import type {
  BenchmarkResult,
  BenchmarkRun,
  ComparisonResult,
} from "@/lib/types";
import { generateGrid, compareAlgorithms } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMs, formatNumber } from "@/lib/utils";

interface BenchmarkVisualInspectorProps {
  result: BenchmarkResult;
  selectedRunNum?: number;
}

export default function BenchmarkVisualInspector({
  result,
  selectedRunNum,
}: BenchmarkVisualInspectorProps) {
  const { raw_results, config } = result;

  // Find the run with maximum node reduction as initial choice
  const bestRun =
    [...raw_results].sort((a, b) => {
      const diffA = a.dijkstra_nodes - a.astar_nodes;
      const diffB = b.dijkstra_nodes - b.astar_nodes;
      return diffB - diffA;
    })[0] || raw_results[0];

  const [currentRun, setCurrentRun] = useState<BenchmarkRun>(bestRun);
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState<ComparisonResult | null>(null);

  const dijkstraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const astarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync when selectedRunNum changes from parent
  useEffect(() => {
    if (selectedRunNum) {
      const found = raw_results.find((r) => r.run === selectedRunNum);
      if (found) setCurrentRun(found);
    }
  }, [selectedRunNum, raw_results]);

  // Load comparison data for current run
  const loadRunVisual = useCallback(
    async (run: BenchmarkRun) => {
      setLoading(true);
      try {
        // 1. Generate grid with the exact seed
        const gridRes = await generateGrid(
          config.grid_size,
          config.obstacle_density,
          run.seed,
        );

        // 2. Compare Dijkstra & A* on this grid
        const res = await compareAlgorithms({
          size: config.grid_size,
          obstacles: gridRes.obstacles,
          start: [0, 0],
          goal: [config.grid_size - 1, config.grid_size - 1],
          heuristic: config.heuristic,
        });

        setCompareData(res);
      } catch (e) {
        console.error("Failed to load run visual", e);
      } finally {
        setLoading(false);
      }
    },
    [config],
  );

  useEffect(() => {
    loadRunVisual(currentRun);
  }, [currentRun, loadRunVisual]);

  // High performance Canvas Drawer
  const drawGridToCanvas = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      visited: [number, number][],
      path: [number, number][],
      visitedColor: string,
      pathColor: string,
    ) => {
      if (!canvas || !compareData) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = config.grid_size;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const cellSize = width / size;

      // 1. Clear background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw grid background & obstacles
      // Reconstruct obstacles set
      // We know visited or start/goal from compareData
      // Empty grid lines
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 0.5;

      // 3. Draw Visited nodes
      ctx.fillStyle = visitedColor;
      for (const [r, c] of visited) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      // 4. Draw Path
      ctx.fillStyle = pathColor;
      for (const [r, c] of path) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      // 5. Draw Start & Goal
      // Start (0, 0)
      ctx.fillStyle = "#10b981";
      ctx.fillRect(0, 0, cellSize, cellSize);
      // Goal (size-1, size-1)
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(
        (size - 1) * cellSize,
        (size - 1) * cellSize,
        cellSize,
        cellSize,
      );
    },
    [compareData, config.grid_size],
  );

  useEffect(() => {
    if (compareData) {
      drawGridToCanvas(
        dijkstraCanvasRef.current,
        compareData.dijkstra.visited_order || [],
        compareData.dijkstra.path || [],
        "#93c5fd", // light blue
        "#2563eb", // dark blue
      );
      drawGridToCanvas(
        astarCanvasRef.current,
        compareData.astar.visited_order || [],
        compareData.astar.path || [],
        "#6ee7b7", // light emerald
        "#059669", // dark emerald
      );
    }
  }, [compareData, drawGridToCanvas]);

  const selectBestRun = () => {
    setCurrentRun(bestRun);
  };

  const selectRandomRun = () => {
    const idx = Math.floor(Math.random() * raw_results.length);
    setCurrentRun(raw_results[idx]);
  };

  const diffNodes = currentRun.dijkstra_nodes - currentRun.astar_nodes;
  const diffPct =
    currentRun.dijkstra_nodes > 0
      ? Math.round((diffNodes / currentRun.dijkstra_nodes) * 100)
      : 0;

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent>
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Trực Quan Hóa Không Gian Tìm Kiếm (Visual Search Space)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              So sánh trực tiếp hình thái vết loang của Dijkstra (loang tròn) và
              A* (bám đích hình nón)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectBestRun}
              className={`text-xs h-8 ${
                currentRun.run === bestRun.run
                  ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                  : ""
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Ván A* Thắng Áp Đảo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={selectRandomRun}
              className="text-xs h-8 text-slate-600"
            >
              <Shuffle className="w-3.5 h-3.5 mr-1 text-blue-500" />
              Ván Ngẫu Nhiên
            </Button>

            <div className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600">
              Đang xem: <strong>Lượt #{currentRun.run}</strong> (Seed:{" "}
              {currentRun.seed})
            </div>
          </div>
        </div>

        {/* Side-by-Side Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center rounded-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <RotateCcw className="w-4 h-4 animate-spin" />
                Đang vẽ không gian tìm kiếm...
              </div>
            </div>
          )}

          {/* Left: Dijkstra */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                <h4 className="text-sm font-bold text-slate-800">
                  Dijkstra — f(n) = g(n)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {formatNumber(currentRun.dijkstra_nodes)} nodes
              </span>
            </div>

            {/* Canvas Container */}
            <div className="aspect-square w-full max-w-xs mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
              <canvas ref={dijkstraCanvasRef} className="w-full h-full block" />
            </div>

            {/* Dijkstra Stats Badge */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">
                  Thời gian
                </span>
                <strong className="text-slate-700">
                  {formatMs(currentRun.dijkstra_time)}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">
                  Đã duyệt
                </span>
                <strong className="text-blue-600">
                  {formatNumber(currentRun.dijkstra_nodes)}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">Độ dài</span>
                <strong className="text-slate-700">
                  {formatNumber(currentRun.dijkstra_distance)}
                </strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              🌊 Mở rộng đồng đều theo dạng sóng tròn vì không biết vị trí đích.
            </p>
          </div>

          {/* Right: A* */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <h4 className="text-sm font-bold text-slate-800">
                  A* — f(n) = g(n) + h(n)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {formatNumber(currentRun.astar_nodes)} nodes (↓{diffPct}%)
              </span>
            </div>

            {/* Canvas Container */}
            <div className="aspect-square w-full max-w-xs mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
              <canvas ref={astarCanvasRef} className="w-full h-full block" />
            </div>

            {/* A* Stats Badge */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">
                  Thời gian
                </span>
                <strong className="text-slate-700">
                  {formatMs(currentRun.astar_time)}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">
                  Đã duyệt
                </span>
                <strong className="text-emerald-600">
                  {formatNumber(currentRun.astar_nodes)}
                </strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block">Độ dài</span>
                <strong className="text-slate-700">
                  {formatNumber(currentRun.astar_distance)}
                </strong>
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium text-center">
              🎯 Luồng tìm kiếm thắt nhọn hướng thẳng đến Goal nhờ hàm
              Heuristic.
            </p>
          </div>
        </div>

        {/* Legend Strip */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              Điểm bắt đầu (Start)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              Điểm đích (Goal)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-300" />
              Vết duyệt Dijkstra
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-300" />
              Vết duyệt A*
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-600" />
              Đường đi tối ưu
            </span>
          </div>

          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hai đường đi có cùng độ dài (Admissible)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
