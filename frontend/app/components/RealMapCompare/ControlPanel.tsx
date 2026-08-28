import React from "react";
import { Globe, MapPin, Zap, Clock, Map as MapIcon, RotateCcw, Pause, Play, StepBack, StepForward, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/utils";
import type { Heuristic } from "@/lib/types";

interface ControlPanelProps {
  realCity: string;
  setRealCity: (val: string) => void;
  loadingGraph: boolean;
  loadingGraphProgress: number;
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  handleLoadGraph: () => void;
  realStart: { lat: number; lon: number } | null;
  realGoal: { lat: number; lon: number } | null;
  heuristic: Heuristic;
  setHeuristic: (val: Heuristic) => void;
  animationSpeed: number;
  setAnimationSpeed: (val: number) => void;
  handleReset: () => void;
  handleCompare: () => void;
  loading: boolean;
  result: any;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  stepBackward: () => void;
  stepForward: () => void;
  animationProgress: number;
  setAnimationProgress: (val: number) => void;
  totalAnimationNodes: number;
}

const cityLabels: Record<string, string> = {
  hanoi: "Hà Nội",
  hochiminh: "TP. Hồ Chí Minh",
  danang: "Đà Nẵng"
};

const heuristicLabels: Record<string, string> = {
  euclidean: "Euclidean",
  manhattan: "Manhattan",
  chebyshev: "Chebyshev"
};

export default function ControlPanel({
  realCity, setRealCity, loadingGraph, loadingGraphProgress, osmStats, handleLoadGraph,
  realStart, realGoal, heuristic, setHeuristic, animationSpeed, setAnimationSpeed,
  handleReset, handleCompare, loading, result, isPlaying, setIsPlaying,
  stepBackward, stepForward, animationProgress, setAnimationProgress, totalAnimationNodes
}: ControlPanelProps) {

  const selectedCityLabel = cityLabels[realCity] || "Chọn thành phố";
  const selectedHeuristicLabel = heuristicLabels[heuristic] || "Chọn heuristic";

  return (
    <Card className="mb-4 overflow-visible">
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Cột 1: Dữ liệu bản đồ */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> DỮ LIỆU BẢN ĐỒ
            </h3>
            <div className="flex flex-col xl:flex-row gap-2">
              <Select value={realCity} onValueChange={(val) => setRealCity(val as string)}>
                <SelectTrigger className="flex-1 bg-slate-50 h-[40px] border-slate-200">
                  <SelectValue placeholder="Chọn thành phố">{selectedCityLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hanoi">Hà Nội</SelectItem>
                  <SelectItem value="hochiminh">TP. Hồ Chí Minh</SelectItem>
                  <SelectItem value="danang">Đà Nẵng</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={handleLoadGraph} disabled={loadingGraph}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 h-[40px] px-3"
              >
                {loadingGraph ? <Clock className="w-4 h-4 animate-spin" /> : <MapIcon className="w-4 h-4" />}
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm h-[68px] flex flex-col justify-center relative overflow-hidden">
              {loadingGraph ? (
                <div className="absolute inset-0 bg-blue-50/50 flex flex-col justify-center px-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-blue-700 animate-pulse">Đang tải...</span>
                    <span className="text-sm font-bold text-blue-600">{loadingGraphProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingGraphProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : osmStats.loaded ? (
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-600 flex items-center gap-1.5 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Graph sẵn sàng
                  </p>
                  <p className="text-slate-500 text-sm font-medium leading-tight">
                    <span className="font-mono text-slate-700">{formatNumber(osmStats.nodes || 0)}</span> Nodes <br /> <span className="font-mono text-slate-700">{formatNumber(osmStats.edges || 0)}</span> Edges
                  </p>
                </div>
              ) : (
                <p className="font-semibold text-slate-400 flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Chưa tải dữ liệu
                </p>
              )}
            </div>
          </div>

          {/* Cột 2: Điểm tìm đường */}
          <div className="space-y-4 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" /> TỌA ĐỘ ĐIỂM
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm shrink-0">1</div>
                <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-200 text-sm flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-sm ml-1">Start:</span>
                  <span className="font-mono text-slate-700 font-semibold text-[13px]">{realStart ? `${realStart.lat.toFixed(5)}, ${realStart.lon.toFixed(5)}` : "Click bản đồ"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-sm shrink-0">2</div>
                <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-200 text-sm flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-sm ml-1">Goal:</span>
                  <span className="font-mono text-slate-700 font-semibold text-[13px]">{realGoal ? `${realGoal.lat.toFixed(5)}, ${realGoal.lon.toFixed(5)}` : "Click bản đồ"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 3: Cấu hình thuật toán */}
          <div className="space-y-4 xl:border-l border-slate-100 xl:pl-6 pt-4 xl:pt-0 border-t xl:border-t-0">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> CẤU HÌNH
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 px-3 rounded-xl border border-slate-200 h-[45px] flex items-center gap-3">
                <label className="text-[13px] font-bold text-slate-500 uppercase whitespace-nowrap">Heuristic (A*)</label>
                <div className="flex-1">
                  <Select value={heuristic} onValueChange={(val) => setHeuristic(val as Heuristic)}>
                    <SelectTrigger className="w-full h-8 bg-white font-bold text-indigo-700 border-slate-200">
                      <SelectValue placeholder="Chọn heuristic">{selectedHeuristicLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="euclidean">Euclidean</SelectItem>
                      <SelectItem value="manhattan">Manhattan</SelectItem>
                      <SelectItem value="chebyshev">Chebyshev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-slate-50 px-3 rounded-xl border border-slate-200 h-[45px] flex items-center gap-3">
                <label className="text-[13px] font-bold text-slate-500 uppercase whitespace-nowrap">Tốc độ</label>
                <div className="flex-1 flex items-center px-1">
                  <Slider
                    value={[animationSpeed]} min={1} max={100} step={1}
                    onValueChange={(val) => setAnimationSpeed(Array.isArray(val) ? val[0] : val)}
                  />
                </div>
                <span className="text-[13px] font-bold text-indigo-600 w-6 text-right">{animationSpeed}x</span>
              </div>
            </div>
          </div>

          {/* Cột 4: Điều khiển */}
          <div className="space-y-3 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-emerald-500" /> THỰC THI
            </h3>

            <div className="space-y-3 flex-1 flex flex-col justify-start">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="h-10 w-10 shrink-0 bg-slate-50 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors" title="Làm mới">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleCompare}
                  disabled={loading || !realStart || !realGoal || !osmStats.loaded}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md disabled:opacity-50"
                >
                  {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />} CHẠY SO SÁNH
                </Button>
              </div>

              {result ? (
                <div className="flex items-center justify-between gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? "Tạm dừng" : "Tiếp tục"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </Button>
                    <div className="flex items-center ml-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={stepBackward} title="Lùi 1 bước">
                        <StepBack className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-200" onClick={stepForward} title="Tiến 1 bước">
                        <StepForward className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => {
                        setIsPlaying(false);
                        setAnimationProgress(totalAnimationNodes);
                      }}
                      className="h-7 px-2 text-[13px] uppercase font-bold text-slate-500 hover:text-slate-700 border-slate-200"
                    >
                      Skip
                    </Button>
                    <div className="text-[13px] font-bold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm w-10 text-center">
                      {Math.min(100, Math.round((animationProgress / Math.max(1, totalAnimationNodes)) * 100))}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[46px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-400 font-medium bg-slate-50/50">
                  Chưa có dữ liệu chạy
                </div>
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
