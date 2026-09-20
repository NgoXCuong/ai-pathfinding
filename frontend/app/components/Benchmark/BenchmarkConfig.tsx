"use client";

import React from "react";
import { Play, Clock, Zap, Target, Flame, Sparkles, Cpu } from "lucide-react";
import type { Heuristic } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface BenchmarkConfigProps {
  iterations: number;
  setIterations: (val: number) => void;
  gridSize: number;
  setGridSize: (val: number) => void;
  density: number;
  setDensity: (val: number) => void;
  heuristic: Heuristic;
  setHeuristic: (val: Heuristic) => void;
  loading: boolean;
  onRun: () => void;
}

export default function BenchmarkConfig({
  iterations,
  setIterations,
  gridSize,
  setGridSize,
  density,
  setDensity,
  heuristic,
  setHeuristic,
  loading,
  onRun,
}: BenchmarkConfigProps) {
  const applyPreset = (
    presetI: number,
    presetS: number,
    presetD: number,
    presetH: Heuristic,
  ) => {
    setIterations(presetI);
    setGridSize(presetS);
    setDensity(presetD);
    setHeuristic(presetH);
  };

  const totalNodes = gridSize * gridSize;
  const estEdges = Math.round(totalNodes * (1 - density) * 3.8);
  const hStartEstimate = 2 * (gridSize - 1);

  return (
    <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
      <CardContent className="space-y-3">
        {/* Top Header: Presets & Scale info merged into 1 compact bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Kịch bản:
            </span>

            <button
              type="button"
              onClick={() => applyPreset(20, 20, 0.2, "manhattan")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                gridSize === 20 && iterations === 20
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Nhanh (20×20)
            </button>

            <button
              type="button"
              onClick={() => applyPreset(50, 50, 0.3, "manhattan")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                gridSize === 50 && iterations === 50
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Target className="w-3 h-3 text-blue-400" />
              Chuẩn (50×50)
            </button>

            <button
              type="button"
              onClick={() => applyPreset(100, 80, 0.35, "manhattan")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                gridSize === 80 && iterations === 100
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              Quy mô lớn (80×80)
            </button>
          </div>

          {/* Graph Scale Context */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>
              |V| ={" "}
              <strong className="text-slate-800">
                {totalNodes.toLocaleString()}
              </strong>
            </span>
            <span>•</span>
            <span>
              |E| ≈{" "}
              <strong className="text-slate-800">
                {estEdges.toLocaleString()}
              </strong>
            </span>
            <span>•</span>
            <span>
              h(start) ≈{" "}
              <strong className="text-indigo-600">{hStartEstimate}</strong>
            </span>
          </div>
        </div>

        {/* Main Controls Row: Ultra-compact, aligned inline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
          {/* 1. Số lần chạy */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Số Lần Chạy
            </label>
            <Select
              value={String(iterations)}
              onValueChange={(v) => setIterations(Number(v))}
            >
              <SelectTrigger className="h-8.5 w-full bg-slate-50/60 border-slate-200 font-medium text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Lượt</SelectItem>
                <SelectItem value="20">20 Lượt</SelectItem>
                <SelectItem value="50">50 Lượt (Chuẩn)</SelectItem>
                <SelectItem value="100">100 Lượt</SelectItem>
                <SelectItem value="200">200 Lượt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Kích thước Grid */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Kích Thước Grid
            </label>
            <Select
              value={String(gridSize)}
              onValueChange={(v) => setGridSize(Number(v))}
            >
              <SelectTrigger className="h-8.5 w-full bg-slate-50/60 border-slate-200 font-medium text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 × 20</SelectItem>
                <SelectItem value="30">30 × 30</SelectItem>
                <SelectItem value="50">50 × 50</SelectItem>
                <SelectItem value="80">80 × 80</SelectItem>
                <SelectItem value="100">100 × 100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Heuristic */}
          <div className="lg:col-span-3 space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Hàm Heuristic (A*)
            </label>
            <Select
              value={heuristic}
              onValueChange={(v) => setHeuristic(v as Heuristic)}
            >
              <SelectTrigger className="h-8.5 w-full bg-slate-50/60 border-slate-200 font-medium text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manhattan">Manhattan (4 hướng)</SelectItem>
                <SelectItem value="euclidean">
                  Euclidean (Đường thẳng)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Mật độ vật cản */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-3 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
              <span>Vật Cản</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 rounded">
                {Math.round(density * 100)}%
              </span>
            </div>
            <div className="py-1">
              <Slider
                min={0.05}
                max={0.5}
                step={0.05}
                value={[density]}
                onValueChange={(vals) =>
                  setDensity(Array.isArray(vals) ? vals[0] : vals)
                }
              />
            </div>
          </div>

          {/* 5. Nút bấm Chạy */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Button
              onClick={onRun}
              disabled={loading}
              className="w-full h-8.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
            >
              {loading ? (
                <>
                  <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang chạy...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Chạy Benchmark
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
