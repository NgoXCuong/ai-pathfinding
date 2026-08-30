"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Play,
  Clock,
  TrendingDown,
  Navigation,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Heuristic, BenchmarkResult, BenchmarkRun } from "@/lib/types";
import { runBenchmark } from "@/lib/api";
import { formatMs, formatNumber } from "@/lib/utils";
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
import { DataTable, SortableHeader } from "@/components/ui/data-table";

// ── Dữ liệu lý thuyết heuristic (static) ────────────────────────────────
interface HeuristicRow {
  name: string;
  formula: string;
  fourDir: React.ReactNode;
  eightDir: React.ReactNode;
  note: string;
}

const heuristicRows: HeuristicRow[] = [
  {
    name: "manhattan",
    formula: "|Δrow| + |Δcol|",
    fourDir: <span className="text-emerald-600 font-bold">✅ Tốt nhất</span>,
    eightDir: <span className="text-amber-500">⚠️ Under-estimate</span>,
    note: "Admissible & Consistent cho 4 hướng. Với 8 hướng: under-estimate nhiều → A* duyệt thêm node.",
  },
  {
    name: "euclidean",
    formula: "√(Δrow² + Δcol²)",
    fourDir: <span className="text-slate-500">🔵 Chấp nhận được</span>,
    eightDir: <span className="text-emerald-600 font-bold">✅ Tốt</span>,
    note: "Luôn admissible. Cho 4 hướng: under-estimate nhiều → A* duyệt thêm node.",
  },
  {
    name: "chebyshev",
    formula: "max(|Δrow|, |Δcol|)",
    fourDir: <span className="text-red-400">❌ Không phù hợp</span>,
    eightDir: <span className="text-amber-500">⚠️ Under-estimate</span>,
    note: "Vẫn admissible & consistent với cost chéo = √2 (mỗi bước tốn ≥ 1). Lỏng hơn Octile.",
  },
  {
    name: "octile",
    formula: "(√2-1)·min + max",
    fourDir: <span className="text-slate-500">🔵 Chấp nhận được</span>,
    eightDir: <span className="text-emerald-600 font-bold">✅ Tốt nhất</span>,
    note: "Tightest admissible cho 8 hướng với cost chéo = √2 — bằng đúng chi phí tối thiểu.",
  },
];

export default function BenchmarkTab() {
  const [iterations, setIterations] = useState(100);
  const [bmGridSize, setBmGridSize] = useState(50);
  const [density, setDensity] = useState(0.25);
  const [heuristic, setHeuristic] = useState<Heuristic>("manhattan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [showHeuristicInfo, setShowHeuristicInfo] = useState(false);

  // ── Columns cho DataTable (cần heuristic state) ──────────────────
  const rawColumns: ColumnDef<BenchmarkRun, unknown>[] = [
    {
      accessorKey: "run",
      header: ({ column }) => (
        <SortableHeader column={column}>#</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-slate-400 font-medium">{row.original.run}</span>
      ),
    },
    {
      accessorKey: "dijkstra_time",
      header: ({ column }) => (
        <SortableHeader column={column} className="text-blue-600">
          Dijk Time
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-slate-600">
          {formatMs(row.original.dijkstra_time)}
        </span>
      ),
    },
    {
      accessorKey: "astar_time",
      header: ({ column }) => (
        <SortableHeader column={column} className="text-cyan-600">
          A* Time
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-slate-600">
          {formatMs(row.original.astar_time)}
        </span>
      ),
    },
    {
      accessorKey: "dijkstra_nodes",
      header: ({ column }) => (
        <SortableHeader column={column} className="text-blue-600">
          Dijk Nodes
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-slate-600">
          {formatNumber(row.original.dijkstra_nodes)}
        </span>
      ),
    },
    {
      accessorKey: "astar_nodes",
      header: ({ column }) => (
        <SortableHeader column={column} className="text-cyan-600">
          A* Nodes
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-slate-600">
          {formatNumber(row.original.astar_nodes)}
        </span>
      ),
    },
    {
      id: "improvement",
      header: ({ column }) => (
        <SortableHeader column={column}>A* vs Dijk</SortableHeader>
      ),
      cell: ({ row }) => {
        const d = row.original;
        if (d.dijkstra_nodes <= 0)
          return <span className="text-slate-400">—</span>;
        const pct =
          ((d.dijkstra_nodes - d.astar_nodes) / d.dijkstra_nodes) * 100;
        return (
          <span
            className={`font-mono font-bold ${pct >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {pct >= 0 ? "↓" : "↑"} {Math.abs(pct).toFixed(1)}%
          </span>
        );
      },
    },
  ];

  const heuristicColumns: ColumnDef<HeuristicRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Heuristic",
      cell: ({ row }) => {
        const isSelected = row.original.name === heuristic;
        return (
          <span
            className={`font-bold ${isSelected ? "text-indigo-700" : "text-slate-700"}`}
          >
            {row.original.name.charAt(0).toUpperCase() +
              row.original.name.slice(1)}
            {isSelected && (
              <span className="text-[10px] bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full ml-1.5">
                ĐANG DÙNG
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "formula",
      header: "Công thức",
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 text-xs">
          {row.original.formula}
        </span>
      ),
    },
    {
      accessorKey: "fourDir",
      header: "4 hướng",
      cell: ({ row }) => row.original.fourDir,
    },
    {
      accessorKey: "eightDir",
      header: "8 hướng",
      cell: ({ row }) => row.original.eightDir,
    },
    {
      accessorKey: "note",
      header: "Ghi chú",
      cell: ({ row }) => (
        <span className="text-slate-600 text-xs">{row.original.note}</span>
      ),
    },
  ];

  const handleRun = async () => {
    setLoading(true);
    setShowRawDetails(false);
    try {
      const res = await runBenchmark({
        iterations,
        gridSize: bmGridSize,
        obstacleDensity: density,
        heuristic,
      });
      setResult(res);
    } catch (e: any) {
      alert("Lỗi Benchmark: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto w-full pb-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1 h-5 rounded-full bg-linear-to-b from-indigo-400 to-purple-500" />
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Thực Nghiệm & Đánh Giá Hiệu Năng
          </h2>
        </div>
        <p className="text-[13px] text-slate-500 font-normal pl-3 mt-0.5">
          Chạy thuật toán nhiều lần trên môi trường ngẫu nhiên để đo lường và so
          sánh hiệu suất thực tế
        </p>
      </div>

      {/* ── Config Card ─────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 pt-0 pb-0">
          <p className="text-[13px] font-semibold text-slate-400 uppercase mb-5">
            Cấu Hình Thực Nghiệm
          </p>
          <div className="flex flex-wrap items-end gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-500 uppercase">
                Số lần chạy
              </label>
              <Select
                value={String(iterations)}
                onValueChange={(v) => setIterations(Number(v))}
              >
                <SelectTrigger className="h-9.5 min-w-30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Lượt</SelectItem>
                  <SelectItem value="50">50 Lượt</SelectItem>
                  <SelectItem value="100">100 Lượt</SelectItem>
                  <SelectItem value="200">200 Lượt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-500 uppercase">
                Kích thước Grid
              </label>
              <Select
                value={String(bmGridSize)}
                onValueChange={(v) => setBmGridSize(Number(v))}
              >
                <SelectTrigger className="h-9.5 min-w-30 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 × 20</SelectItem>
                  <SelectItem value="50">50 × 50</SelectItem>
                  <SelectItem value="100">100 × 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-500 uppercase     ">
                Heuristic (A*)
              </label>
              <Select
                value={heuristic}
                onValueChange={(v) => setHeuristic(v as Heuristic)}
              >
                <SelectTrigger className="h-9.5 min-w-32.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manhattan">Manhattan</SelectItem>
                  <SelectItem value="euclidean">Euclidean</SelectItem>
                  <SelectItem value="chebyshev">Chebyshev</SelectItem>
                  <SelectItem value="octile">Octile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-50 max-w-70">
              <label className="block text-sm font-semibold text-slate-500 uppercase">
                Mật độ vật cản ({Math.round(density * 100)}%)
              </label>
              <div className="mt-3">
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

            <Button
              onClick={handleRun}
              disabled={loading}
              className="ml-auto h-9.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/25"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" /> Đang chạy...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" /> Chạy Benchmark
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Results ─────────────────────────────────────────── */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 1. KẾT LUẬN TRƯỚC */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl text-white border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <TrendingDown className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-8 uppercase">
                🏆{" "}
                {(() => {
                  const astarWinsNodes =
                    result.stats.astar.nodes.avg <
                    result.stats.dijkstra.nodes.avg;
                  const astarWinsTime =
                    result.stats.astar.time.avg <
                    result.stats.dijkstra.time.avg;
                  if (astarWinsNodes && astarWinsTime)
                    return "A* NHANH HƠN & DUYỆT ÍT NÚT HƠN";
                  if (astarWinsNodes) return "A* DUYỆT ÍT NÚT HƠN";
                  if (astarWinsTime) return "A* NHANH HƠN";
                  return "DIJKSTRA HIỆU QUẢ HƠN";
                })()}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <p className="text-emerald-400 font-bold text-2xl mb-1">
                    {result.stats.astar.time.avg <
                    result.stats.dijkstra.time.avg
                      ? `↓ ${result.improvement.time_pct}%`
                      : `↑ ${Math.abs(result.improvement.time_pct)}%`}
                  </p>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-1">
                    Thời gian
                  </p>
                  <p className="text-white text-lg font-mono font-bold">
                    {formatMs(result.stats.dijkstra.time.avg)} →{" "}
                    {formatMs(result.stats.astar.time.avg)}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-400 font-bold text-2xl mb-1">
                    {result.stats.astar.nodes.avg <
                    result.stats.dijkstra.nodes.avg
                      ? `↓ ${result.improvement.nodes_pct}%`
                      : `↑ ${Math.abs(result.improvement.nodes_pct)}%`}
                  </p>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-1">
                    Nút duyệt
                  </p>
                  <p className="text-white text-lg font-mono font-bold">
                    {formatNumber(result.stats.dijkstra.nodes.avg)} →{" "}
                    {formatNumber(result.stats.astar.nodes.avg)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold text-2xl mb-1">=</p>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-1">
                    Độ dài đường đi
                  </p>
                  <p className="text-white text-lg font-mono font-bold">
                    {formatNumber(result.stats.dijkstra.distance.avg)} ={" "}
                    {formatNumber(result.stats.astar.distance.avg)} bước
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 inline-block">
                <p className="text-slate-300 font-medium text-[13px]">
                  Kết quả được tính từ{" "}
                  <strong className="text-white font-semibold">
                    {iterations} lần chạy
                  </strong>{" "}
                  trên grid{" "}
                  <strong className="text-white font-semibold">
                    {bmGridSize}×{bmGridSize}
                  </strong>
                  ,{" "}
                  <strong className="text-white font-semibold">
                    {Math.round(density * 100)}% vật cản
                  </strong>
                  , heuristic{" "}
                  <strong className="text-white font-semibold">
                    {heuristic}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* 2 & 3. BIỂU ĐỒ CHỨNG MINH */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Chart 1: Thời Gian */}
            <Card className="border-slate-200 shadow-sm p-6">
              <h4 className="text-sm font-semibold text-slate-800 uppercase flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-slate-500" /> Thời Gian Trung
                Bình
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-blue-600">Dijkstra</span>
                    <span className="font-mono text-sm font-semibold text-slate-700">
                      {formatMs(result.stats.dijkstra.time.avg)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (result.stats.dijkstra.time.avg / Math.max(result.stats.dijkstra.time.avg, result.stats.astar.time.avg)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-cyan-600">A*</span>
                    <span className="font-mono text-sm font-semibold text-slate-700">
                      {formatMs(result.stats.astar.time.avg)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (result.stats.astar.time.avg / Math.max(result.stats.dijkstra.time.avg, result.stats.astar.time.avg)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Chart 2: Nút Duyệt */}
            <Card className="border-slate-200 shadow-sm p-6">
              <h4 className="text-sm font-semibold text-slate-800 uppercase flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-slate-500" /> Số Nút Duyệt
                Trung Bình
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-blue-600">Dijkstra</span>
                    <span className="font-mono text-sm font-semibold text-slate-700">
                      {formatNumber(result.stats.dijkstra.nodes.avg)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (result.stats.dijkstra.nodes.avg / Math.max(result.stats.dijkstra.nodes.avg, result.stats.astar.nodes.avg)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-cyan-600">A*</span>
                    <span className="font-mono text-sm font-semibold text-slate-700">
                      {formatNumber(result.stats.astar.nodes.avg)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (result.stats.astar.nodes.avg / Math.max(result.stats.dijkstra.nodes.avg, result.stats.astar.nodes.avg)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Chart 3: Đường Đi */}
            <Card className="border-slate-200 shadow-sm flex flex-col justify-center items-center text-center p-6">
              <h4 className="text-sm font-semibold text-slate-800 uppercase flex items-center gap-2 mb-6 w-full justify-center">
                <Navigation className="w-4 h-4 text-slate-500" /> Độ Dài Đường
                Đi
              </h4>
              <div className="space-y-4 w-full px-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-semibold text-blue-600">Dijkstra</span>
                  <span className="font-mono font-bold text-slate-700 text-lg">
                    {formatNumber(result.stats.dijkstra.distance.avg)}{" "}
                    <span className="text-sm font-medium text-slate-400">
                      bước
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3">
                  <span className="font-semibold text-cyan-600">A*</span>
                  <span className="font-mono font-bold text-slate-700 text-lg">
                    {formatNumber(result.stats.astar.distance.avg)}{" "}
                    <span className="text-sm font-medium text-slate-400">
                      bước
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4" /> Kết quả tương đương
              </div>
            </Card>
          </div>

          {/* 4. CHI TIẾT RAW */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowRawDetails(!showRawDetails)}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
            >
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                Chi tiết {iterations} lần chạy
              </h3>
              {showRawDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {showRawDetails && (
              <div className="max-h-120 overflow-y-auto custom-scrollbar">
                <DataTable
                  columns={rawColumns}
                  data={result.raw_results}
                  getRowId={(row) => String(row.run)}
                  className="text-[13px]"
                />
              </div>
            )}
          </Card>

          {/* ── Bảng phân tích lý thuyết Heuristic ───────────────── */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowHeuristicInfo(!showHeuristicInfo)}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
            >
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Phân tích lý thuyết: So sánh Heuristic & Dijkstra vs A*
              </h3>
              {showHeuristicInfo ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showHeuristicInfo && (
              <div className="p-6 space-y-6 animate-in fade-in duration-300">
                {/* Section 1: So sánh heuristic */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-400 rounded-full" />
                    So Sánh 4 Heuristic của A*
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <DataTable
                      columns={heuristicColumns}
                      data={heuristicRows}
                      getRowId={(row) => row.name}
                      getRowClassName={(row) =>
                        row.name === heuristic ? "bg-indigo-50" : undefined
                      }
                    />
                  </div>
                </div>

                {/* Section 2: Dijkstra vs A* */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-400 rounded-full" />
                    Dijkstra vs A* — Phân Tích Lý Thuyết
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h5 className="font-bold text-blue-700 mb-2">
                        Dijkstra — f(n) = g(n)
                      </h5>
                      <ul className="text-sm text-blue-800 space-y-1.5">
                        <li>• Không dùng thông tin về vị trí đích</li>
                        <li>• Mở rộng đồng đều ra mọi hướng như sóng tròn</li>
                        <li>• Đảm bảo tìm đường ngắn nhất (trọng số ≥ 0)</li>
                        <li>• Tương đương A* với h(n) = 0</li>
                        <li>• ✅ Phù hợp: không biết vị trí đích</li>
                      </ul>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                      <h5 className="font-bold text-cyan-700 mb-2">
                        A* — f(n) = g(n) + h(n)
                      </h5>
                      <ul className="text-sm text-cyan-800 space-y-1.5">
                        <li>
                          • Dùng heuristic để ước lượng khoảng cách đến đích
                        </li>
                        <li>
                          • Tập trung tìm kiếm về hướng goal → ít node duyệt hơn
                        </li>
                        <li>• Optimal nếu h(n) admissible: h(n) ≤ h*(n)</li>
                        <li>
                          • Nhanh hơn Dijkstra đáng kể trên không gian lớn
                        </li>
                        <li>• ✅ Phù hợp: bản đồ, grid, không gian hình học</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 3: Kết luận */}
                <div className="bg-slate-800 text-white rounded-xl p-5">
                  <h4 className="font-bold text-white mb-3">
                    📊 Kết Luận Từ Thực Nghiệm
                  </h4>
                  {result ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-300">
                        Qua{" "}
                        <strong className="text-white">
                          {iterations} lần chạy
                        </strong>{" "}
                        trên grid{" "}
                        <strong className="text-white">
                          {bmGridSize}×{bmGridSize}
                        </strong>{" "}
                        với mật độ vật cản{" "}
                        <strong className="text-white">
                          {Math.round(density * 100)}%
                        </strong>
                        , heuristic{" "}
                        <strong className="text-white">{heuristic}</strong>:
                      </p>
                      <p className="text-emerald-300 font-semibold">
                        A* duyệt ít hơn {result.improvement.nodes_pct}% node,
                        nhanh hơn {result.improvement.time_pct}% so với
                        Dijkstra.
                      </p>
                      <p className="text-slate-400 text-xs">
                        Điều này khẳng định lý thuyết: heuristic admissible giúp
                        A* loại trừ các node không cần thiết mà vẫn đảm bảo tìm
                        đường tối ưu.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">
                      Chạy benchmark để xem kết quả thực nghiệm.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
