"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { Heuristic, BenchmarkResult } from "@/lib/types";
import { runBenchmark } from "@/lib/api";

import BenchmarkConfig from "./Benchmark/BenchmarkConfig";
import BenchmarkHeroBanner from "./Benchmark/BenchmarkHeroBanner";
import BenchmarkMetricCards from "./Benchmark/BenchmarkMetricCards";
import BenchmarkCharts from "./Benchmark/BenchmarkCharts";
import BenchmarkVisualInspector from "./Benchmark/BenchmarkVisualInspector";
import BenchmarkDataTable from "./Benchmark/BenchmarkDataTable";

export default function BenchmarkTab() {
  // Config state
  const [iterations, setIterations] = useState(50);
  const [bmGridSize, setBmGridSize] = useState(50);
  const [density, setDensity] = useState(0.25);
  const [heuristic, setHeuristic] = useState<Heuristic>("manhattan");

  // Execution state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  // Selected run for visual inspector
  const [selectedRunForVisual, setSelectedRunForVisual] = useState<
    number | undefined
  >(undefined);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runBenchmark({
        iterations,
        gridSize: bmGridSize,
        obstacleDensity: density,
        heuristic,
      });
      setResult(res);
      setSelectedRunForVisual(undefined);
    } catch (e: unknown) {
      alert("Lỗi Benchmark: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRunForVisual = (runNum: number) => {
    setSelectedRunForVisual(runNum);
    // Smooth scroll to visual inspector
    const elem = document.getElementById("visual-inspector-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto w-full pb-5 animate-in fade-in duration-300">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1.5 h-6 rounded-full bg-linear-to-b from-indigo-500 via-blue-500 to-emerald-500" />
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Thực Nghiệm & Đánh Giá Hiệu Năng So Sánh
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium pl-4">
          Đo lường định lượng và so sánh toàn diện 12 chỉ số học thuật giữa
          thuật toán Dijkstra và A* trên môi trường ngẫu nhiên
        </p>
      </div>

      {/* ── 1. Configuration & Presets ───────────────────────────── */}
      <BenchmarkConfig
        iterations={iterations}
        setIterations={setIterations}
        gridSize={bmGridSize}
        setGridSize={setBmGridSize}
        density={density}
        setDensity={setDensity}
        heuristic={heuristic}
        setHeuristic={setHeuristic}
        loading={loading}
        onRun={handleRun}
      />

      {/* ── 2. Results & Deep Analytics (Liền mạch, không dùng Tab) ── */}
      {result && (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Executive Hero Banner (4 Chỉ số vàng) */}
          <BenchmarkHeroBanner result={result} />

          {/* 6 Metric Comparison Cards */}
          <BenchmarkMetricCards result={result} />

          {/* Khối Biểu Đồ So Sánh Trực Tiếp (Hiển thị luôn tất cả biểu đồ) */}
          <div>
            <BenchmarkCharts
              result={result}
              onSelectRun={handleSelectRunForVisual}
            />
          </div>

          {/* Khối Trực Quan Hóa Vết Loang (Search Space Inspector) */}
          <div id="visual-inspector-section">
            <BenchmarkVisualInspector
              result={result}
              selectedRunNum={selectedRunForVisual}
            />
          </div>

          {/* Bảng Dữ Liệu Chi Tiết Các Lượt Chạy */}
          <div>
            <BenchmarkDataTable
              runs={result.raw_results}
              onSelectRunForVisual={handleSelectRunForVisual}
            />
          </div>
        </div>
      )}
    </div>
  );
}
