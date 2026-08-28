"use client";

import React from "react";
import {
  Play, Pause, SkipForward, FastForward, RotateCcw,
  Clock, StepForward, StepBack, Dices
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Control actions
  hasResults: boolean;
  loading: boolean;

  // Speed & Sync
  animationSpeed: number;
  setAnimationSpeed: (val: number) => void;
  isSynced: boolean;
  setIsSynced: (val: boolean) => void;
}

export default function GridControlPanel({
  gridSize, setGridSize, obstacleDensity, setObstacleDensity,
  allowDiagonal, setAllowDiagonal, heuristic, setHeuristic,
  onConfigChange,
  hasResults, loading,
  animationSpeed, setAnimationSpeed, isSynced, setIsSynced
}: GridControlPanelProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className=" space-y-5">

        {/* ROW 1: CONFIGURATION */}
        <div className="flex flex-col xl:flex-row gap-5 items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

            {/* Heuristic */}
            <div className="flex items-center gap-2.5">
              <label className="text-sm font-bold text-slate-500 uppercase whitespace-nowrap">
                Heuristic
              </label>
              <div className="w-[120px]">
                <Select
                  value={heuristic === "manhattan" ? "Manhattan" : heuristic === "euclidean" ? "Euclidean" : "Chebyshev"}
                  onValueChange={(val) => {
                    if (val) setHeuristic(val.toString().toLowerCase() as Heuristic);
                  }}
                >
                  <SelectTrigger className="h-9 font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhattan" disabled={allowDiagonal}>Manhattan {allowDiagonal && "(Lỗi 8 hướng)"}</SelectItem>
                    <SelectItem value="Euclidean">Euclidean</SelectItem>
                    <SelectItem value="Chebyshev" disabled={!allowDiagonal}>Chebyshev {!allowDiagonal && "(Cần 8 hướng)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kiểu di chuyển */}
            <div className="flex items-center gap-2.5">
              <label className="text-sm font-bold text-slate-500 uppercase whitespace-nowrap">
                Kiểu di chuyển
              </label>
              <div className="w-[105px]">
                <Select
                  value={allowDiagonal ? "8 Hướng" : "4 Hướng"}
                  onValueChange={(v) => {
                    if (!v) return;
                    const is8Way = v.toString() === "8 Hướng";
                    setAllowDiagonal(is8Way);
                    if (is8Way && heuristic === "manhattan") {
                      setHeuristic("chebyshev");
                    } else if (!is8Way && heuristic === "chebyshev") {
                      setHeuristic("manhattan");
                    }
                  }}
                >
                  <SelectTrigger className="h-9 font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 Hướng">4 Hướng</SelectItem>
                    <SelectItem value="8 Hướng">8 Hướng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kích thước */}
            <div className="flex items-center ml-2 border-l border-slate-400 pl-5 gap-2.5">
              <label className="text-sm font-bold text-slate-500 uppercase whitespace-nowrap">
                Kích Thước
              </label>
              <div className="w-[100px]">
                <Select
                  value={`${gridSize} × ${gridSize}`}
                  onValueChange={(v) => {
                    if (!v) return;
                    const size = parseInt(v.toString().split(" ")[0]);
                    setGridSize(size);
                    onConfigChange(size, obstacleDensity);
                  }}
                >
                  <SelectTrigger className="h-9 font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10 × 10">10 × 10</SelectItem>
                    <SelectItem value="20 × 20">20 × 20</SelectItem>
                    <SelectItem value="30 × 30">30 × 30</SelectItem>
                    <SelectItem value="40 × 40">40 × 40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            {/* Vật cản */}
            <div className="flex items-center gap-2.5">
              <label className="text-sm font-bold text-slate-500 uppercase whitespace-nowrap">
                Vật cản: <span className="text-indigo-600 font-bold">{Math.round(obstacleDensity * 100)}%</span>
              </label>
              <div className="w-[90px] pt-1">
                <Slider
                  value={[obstacleDensity]}
                  min={0.05} max={0.5} step={0.05}
                  onValueChange={(val) => {
                    const d = Array.isArray(val) ? val[0] : val;
                    setObstacleDensity(d as number);
                    onConfigChange(gridSize, d as number);
                  }}
                  className="py-1"
                />
              </div>
            </div>



            {/* SPEED & SYNC OPTIONS */}
            <div className="flex items-center gap-2.5 ml-2 border-l border-slate-400 pl-5 h-9">
              <FastForward className="w-4 h-4 text-slate-400" />
              <div className="w-[80px]">
                <Slider
                  value={[animationSpeed]} min={1} max={100} step={1}
                  onValueChange={(val) => {
                    const speed = Array.isArray(val) ? val[0] : val;
                    setAnimationSpeed(speed as number);
                  }}
                  className="py-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sync-mode"
                checked={isSynced}
                onChange={(e) => setIsSynced(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="sync-mode" className="text-sm font-bold text-slate-500 uppercase cursor-pointer select-none">
                Đồng bộ
              </label>
            </div>
          </div>

          <Button
            variant="default"
            className="h-9 shrink-0 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5"
            onClick={() => onConfigChange(gridSize, obstacleDensity)}
            disabled={loading}
          >
            <Dices className="w-4 h-4 mr-2" /> Tạo map ngẫu nhiên
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
