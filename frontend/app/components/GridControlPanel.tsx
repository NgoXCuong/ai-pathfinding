"use client";

import React, { useState, useEffect } from "react";
import {
  FastForward,
  Dices,
  Clock,
  RotateCcw,
  Play,
  Pause,
  StepBack,
  StepForward,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Heuristic, DrawMode } from "@/lib/types";

interface GridControlPanelProps {
  // Config
  gridSize: number;
  setGridSize: (val: number) => void;
  obstacleDensity: number;
  setObstacleDensity: (val: number) => void;
  allowDiagonal: boolean;
  setAllowDiagonal: (val: boolean) => void;
  heuristic: Heuristic;
  setHeuristic: (val: Heuristic) => void;
  onConfigChange: (size: number, density: number) => void;

  // Execution & Actions
  loading: boolean;
  hasResults: boolean;
  runCompare: () => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  stepBackward: () => void;
  stepForward: () => void;
  skipToEnd: () => void;

  // Draw Tools
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;

  // Speed
  animationSpeed: number;
  setAnimationSpeed: (val: number) => void;
}

export default function GridControlPanel({
  gridSize,
  setGridSize,
  obstacleDensity,
  setObstacleDensity,
  allowDiagonal,
  setAllowDiagonal,
  heuristic,
  setHeuristic,
  onConfigChange,
  loading,
  hasResults,
  runCompare,
  isPlaying,
  setIsPlaying,
  stepBackward,
  stepForward,
  skipToEnd,
  drawMode,
  setDrawMode,
  animationSpeed,
  setAnimationSpeed,
}: GridControlPanelProps) {
  const [inputSize, setInputSize] = useState(gridSize.toString());

  useEffect(() => {
    setInputSize(gridSize.toString());
  }, [gridSize]);

  const handleApplySize = (newVal?: number) => {
    const val = newVal ?? parseInt(inputSize, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(5, Math.min(80, val));
      setGridSize(clamped);
      setInputSize(clamped.toString());
      onConfigChange(clamped, obstacleDensity);
    } else {
      setInputSize(gridSize.toString());
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="space-y-2.5">
        {/* ── HÀNG 1: ĐIỀU KHIỂN CHẠY, CÔNG CỤ VẼ & TẠO MAP ── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Cụm 1: Nút Chạy & Điều khiển playback */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={runCompare}
              disabled={loading}
              className="h-8 px-4 font-bold shadow-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs"
            >
              {loading ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : hasResults ? (
                <RotateCcw className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {loading
                  ? "Đang tính..."
                  : hasResults
                    ? "Chạy Lại"
                    : "Chạy So Sánh"}
              </span>
            </Button>

            {hasResults && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-xs"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 mr-1 text-amber-500" /> Tạm
                      dừng
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1 text-emerald-500" />{" "}
                      Tiếp tục
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-600 hover:bg-white rounded"
                    onClick={stepBackward}
                    title="Lùi 1 bước"
                  >
                    <StepBack className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-600 hover:bg-white rounded"
                    onClick={stepForward}
                    title="Tiến 1 bước"
                  >
                    <StepForward className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-600 hover:bg-white rounded"
                    onClick={skipToEnd}
                    title="Bỏ qua đến đích"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Cụm 2: Công cụ vẽ */}
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase px-1.5">
              Vẽ:
            </span>
            {[
              { mode: "obstacle" as DrawMode, label: "🧱 Cản" },
              { mode: "erase" as DrawMode, label: "🧹 Xóa" },
              { mode: "start" as DrawMode, label: "🟢 Bắt đầu" },
              { mode: "goal" as DrawMode, label: "🔴 Đích" },
            ].map((tool) => (
              <Button
                key={tool.mode}
                variant={drawMode === tool.mode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDrawMode(tool.mode)}
                className={`h-7 px-2 text-xs font-medium rounded transition-all ${
                  drawMode === tool.mode
                    ? "bg-white text-slate-900 shadow-xs font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tool.label}
              </Button>
            ))}
          </div>

          {/* Cụm 3: Ký hiệu & Nút tạo map ngẫu nhiên */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-slate-400"></span> Cản
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-blue-300"></span> Đã
                duyệt
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-purple-500"></span> Đường
                đi
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-semibold px-3 text-xs rounded-lg"
              onClick={() => onConfigChange(gridSize, obstacleDensity)}
              disabled={loading}
            >
              <Dices className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Tạo map
              ngẫu nhiên
            </Button>
          </div>
        </div>

        {/* ── HÀNG 2: CẤU HÌNH THUẬT TOÁN, TỰ NHẬP KÍCH THƯỚC, VẬT CẢN & TỐC ĐỘ ── */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Heuristic */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                Heuristic:
              </label>
              <div className="w-[110px]">
                <Select
                  value={heuristic === "manhattan" ? "Manhattan" : "Euclidean"}
                  onValueChange={(val) => {
                    if (val)
                      setHeuristic(val.toString().toLowerCase() as Heuristic);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhattan">Manhattan</SelectItem>
                    <SelectItem value="Euclidean">Euclidean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kiểu di chuyển */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                Di chuyển:
              </label>
              <div className="w-[95px]">
                <Select
                  value={allowDiagonal ? "8 Hướng" : "4 Hướng"}
                  onValueChange={(v) => {
                    if (!v) return;
                    const is8Way = v.toString() === "8 Hướng";
                    setAllowDiagonal(is8Way);
                    if (is8Way && heuristic === "manhattan") {
                      setHeuristic("euclidean");
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 Hướng">4 Hướng</SelectItem>
                    <SelectItem value="8 Hướng">8 Hướng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kích thước: TỰ NHẬP KÍCH THƯỚC + CHIP CHỌN NHANH */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                Kích thước:
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <input
                  type="number"
                  min={5}
                  max={80}
                  value={inputSize}
                  onChange={(e) => setInputSize(e.target.value)}
                  onBlur={() => handleApplySize()}
                  onKeyDown={(e) => e.key === "Enter" && handleApplySize()}
                  className="w-10 h-6 text-center font-bold text-xs bg-white text-slate-800 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Nhập kích thước (5-80) và ấn Enter"
                />
                <span className="text-[10px] font-bold text-slate-400 px-1">
                  ×
                </span>
                <span className="text-xs font-bold text-slate-600 pr-1.5">
                  {inputSize}
                </span>
              </div>

              {/* Nút chọn nhanh (Presets) */}
              <div className="hidden sm:flex items-center gap-1">
                {[15, 25, 40, 50].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleApplySize(s)}
                    className={`h-6 px-1.5 text-[11px] font-semibold rounded transition-all ${
                      gridSize === s
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cụm Vật cản & Tốc độ */}
          <div className="flex items-center gap-4">
            {/* Vật cản */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                Vật cản:{" "}
                <span className="text-indigo-600 font-bold">
                  {Math.round(obstacleDensity * 100)}%
                </span>
              </label>
              <div className="w-[75px]">
                <Slider
                  value={[obstacleDensity]}
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  onValueChange={(val) => {
                    const d = Array.isArray(val) ? val[0] : val;
                    setObstacleDensity(d as number);
                    onConfigChange(gridSize, d as number);
                  }}
                  className="py-1"
                />
              </div>
            </div>

            {/* Tốc độ animation */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <FastForward className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-[75px]">
                <Slider
                  value={[animationSpeed]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(val) => {
                    const speed = Array.isArray(val) ? val[0] : val;
                    setAnimationSpeed(speed as number);
                  }}
                  className="py-1"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
