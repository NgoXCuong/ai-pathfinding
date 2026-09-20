"use client";

import React from "react";
import {
  Globe,
  Zap,
  Clock,
  RotateCcw,
  Pause,
  Play,
  StepBack,
  StepForward,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/utils";
import type { Heuristic, RealCompareResult } from "@/lib/types";

interface ControlPanelProps {
  realCity: string;
  setRealCity: (val: string) => void;
  loadingGraph: boolean;
  loadingGraphProgress: number;
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  handleLoadGraph: () => void;
  realStart: { lat: number; lon: number } | null;
  realGoal: { lat: number; lon: number } | null;
  handleSwapPoints?: () => void;
  heuristic: Heuristic;
  setHeuristic: (val: Heuristic) => void;
  animationSpeed: number;
  setAnimationSpeed: (val: number) => void;
  handleReset: () => void;
  handleCompare: () => void;
  loading: boolean;
  result: RealCompareResult | null;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  stepBackward: () => void;
  stepForward: () => void;
  skipToEnd: () => void;
  progressPercent: number;
}

const cityLabels: Record<string, string> = {
  hanoi: "Hà Nội",
  hochiminh: "TP. Hồ Chí Minh",
  danang: "Đà Nẵng",
};

const heuristicLabels: Record<string, string> = {
  euclidean: "Euclidean",
  manhattan: "Manhattan",
};

export default function ControlPanel({
  realCity,
  setRealCity,
  loadingGraph,
  loadingGraphProgress,
  osmStats,
  handleLoadGraph,
  realStart,
  realGoal,
  handleSwapPoints,
  heuristic,
  setHeuristic,
  animationSpeed,
  setAnimationSpeed,
  handleReset,
  handleCompare,
  loading,
  result,
  isPlaying,
  setIsPlaying,
  stepBackward,
  stepForward,
  skipToEnd,
  progressPercent,
}: ControlPanelProps) {
  const selectedCityLabel = cityLabels[realCity] || "Chọn thành phố";
  const selectedHeuristicLabel = heuristicLabels[heuristic] || "Chọn heuristic";

  return (
    <Card className="p-2.5 sm:p-3 bg-white border border-slate-200 shadow-sm rounded-2xl mb-4 overflow-visible">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ── 1. KHU VỰC BẢN ĐỒ & TRẠNG THÁI GRAPH ── */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <Select
            value={realCity}
            onValueChange={(val) => setRealCity(val as string)}
          >
            <SelectTrigger className="w-[125px] sm:w-[140px] h-9 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Chọn thành phố">
                {selectedCityLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hanoi">Hà Nội</SelectItem>
              <SelectItem value="hochiminh">TP. Hồ Chí Minh</SelectItem>
              <SelectItem value="danang">Đà Nẵng</SelectItem>
            </SelectContent>
          </Select>

          {loadingGraph ? (
            <Badge
              variant="secondary"
              className="h-9 px-2.5 bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-pulse"
            >
              <Clock className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>{loadingGraphProgress}%</span>
            </Badge>
          ) : osmStats.loaded ? (
            <Badge
              variant="secondary"
              className="h-9 px-2.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium rounded-xl flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono font-semibold">
                {formatNumber(osmStats.nodes || 0)}
              </span>
              <span className="text-[11px] text-emerald-600 hidden sm:inline">
                nodes
              </span>
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadGraph}
              className="h-9 px-2.5 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100 border-blue-200 rounded-xl flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải Graph</span>
            </Button>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden lg:block" />

        {/* ── 2. KHU VỰC TỌA ĐỘ ĐIỂM (START / SWAP / GOAL) ── */}
        <div className="flex items-center gap-1.5">
          {/* Start Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs h-9">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
              1
            </span>
            <span className="text-slate-400 font-medium text-[11px]">Start:</span>
            <span className="font-mono text-slate-700 font-semibold text-[11px]">
              {realStart
                ? `${realStart.lat.toFixed(4)}, ${realStart.lon.toFixed(4)}`
                : "Click bản đồ"}
            </span>
          </div>

          {/* Swap Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapPoints}
            disabled={!realStart || !realGoal || isPlaying}
            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
            title="Đổi chiều Start ⇄ Goal"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </Button>

          {/* Goal Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs h-9">
            <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px]">
              2
            </span>
            <span className="text-slate-400 font-medium text-[11px]">Goal:</span>
            <span className="font-mono text-slate-700 font-semibold text-[11px]">
              {realGoal
                ? `${realGoal.lat.toFixed(4)}, ${realGoal.lon.toFixed(4)}`
                : "Click bản đồ"}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden xl:block" />

        {/* ── 3. CẤU HÌNH HEURISTIC & TỐC ĐỘ ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">
              H:
            </span>
            <Select
              value={heuristic}
              onValueChange={(val) => setHeuristic(val as Heuristic)}
            >
              <SelectTrigger className="w-[110px] sm:w-[120px] h-9 text-xs font-bold text-indigo-700 bg-slate-50 border-slate-200 rounded-xl">
                <SelectValue placeholder="Chọn heuristic">
                  {selectedHeuristicLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="euclidean">Euclidean</SelectItem>
                <SelectItem value="manhattan">Manhattan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 border border-slate-200 rounded-xl h-9">
            <span className="text-[11px] font-bold text-slate-500">Tốc độ:</span>
            <div className="w-16 sm:w-20">
              <Slider
                value={[animationSpeed]}
                min={1}
                max={100}
                step={1}
                onValueChange={(val) =>
                  setAnimationSpeed(Array.isArray(val) ? val[0] : val)
                }
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-600 w-6 text-right">
              {animationSpeed}x
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden lg:block" />

        {/* ── 4. THỰC THI & PLAYBACK CONTROLS ── */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-9 w-9 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-colors shrink-0"
            title="Làm mới"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleCompare}
            disabled={loading || !realStart || !realGoal || !osmStats.loaded}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <Clock className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            <span>CHẠY SO SÁNH</span>
          </Button>

          {/* Playback Controls (chỉ hiện khi có kết quả) */}
          {result && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl animate-in fade-in duration-300">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Tạm dừng" : "Tiếp tục"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:bg-slate-200 rounded-lg"
                onClick={stepBackward}
                title="Lùi 1 bước"
              >
                <StepBack className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:bg-slate-200 rounded-lg"
                onClick={stepForward}
                title="Tiến 1 bước"
              >
                <StepForward className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipToEnd}
                className="h-7 px-1.5 text-[10px] font-bold uppercase text-slate-600 hover:text-slate-800 border-slate-200 rounded-lg"
              >
                Skip
              </Button>
              <span className="text-[11px] font-mono font-bold text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs min-w-[34px] text-center">
                {Math.min(100, Math.max(0, Math.round(progressPercent)))}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
