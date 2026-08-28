import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Zap, X, StepForward, XCircle, AlertTriangle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatMs, formatNumber, formatDistance } from "@/lib/utils";
import type { RealCompareResult } from "@/lib/types";
import { useState } from "react";

interface SummaryCardProps {
  result: any;
  isAnimationComplete: boolean;
  isSummaryCollapsed: boolean;
  setIsSummaryCollapsed: (val: boolean) => void;
  setShowDetailModal: (val: boolean) => void;
}

export default function SummaryCard({
  result, isAnimationComplete, isSummaryCollapsed,
  setIsSummaryCollapsed, setShowDetailModal
}: SummaryCardProps) {
  const [showTheory, setShowTheory] = useState(false);

  if (!result || !isAnimationComplete) return null;

  const dijkstraFound = result.dijkstra?.found !== false;
  const astarFound = result.astar?.found !== false;
  const bothNotFound = !dijkstraFound && !astarFound;

  if (isSummaryCollapsed) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsSummaryCollapsed(false)}
        className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl h-12 px-4 animate-in slide-in-from-right-8"
      >
        <div className="bg-yellow-100 p-1.5 rounded-lg mr-2"><Zap className="w-4 h-4 text-yellow-600" /></div>
        <span className="font-bold text-slate-700">Hiện kết quả</span>
      </Button>
    );
  }

  // ── Case: Không tìm được đường ─────────────────────────────
  if (bothNotFound) {
    return (
      <Card className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl p-5 w-80 animate-in slide-in-from-right-8 duration-500 border-red-200">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-bold text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" /> Không tìm được đường
          </h4>
          <Button variant="ghost" size="icon" onClick={() => setIsSummaryCollapsed(true)} className="h-6 w-6 text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Cả Dijkstra và A* đều không tìm được đường đi giữa 2 điểm đã chọn.
          Có thể khu vực này không có đường kết nối trong dữ liệu OSM.
        </p>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-xs text-red-700 font-medium">
          💡 Thử chọn 2 điểm khác gần đường lớn hơn.
        </div>
      </Card>
    );
  }

  // ── Case: Một thuật toán không tìm được (hiếm) ─────────────
  if (!dijkstraFound || !astarFound) {
    return (
      <Card className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl p-5 w-80 animate-in slide-in-from-right-8 duration-500 border-amber-200">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-bold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Kết quả một phần
          </h4>
          <Button variant="ghost" size="icon" onClick={() => setIsSummaryCollapsed(true)} className="h-6 w-6 text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          <strong>{!dijkstraFound ? "Dijkstra" : "A*"}</strong> không tìm được đường,
          trong khi <strong>{!dijkstraFound ? "A*" : "Dijkstra"}</strong> tìm được.
          Kết quả bất thường — vui lòng thử lại với điểm khác.
        </p>
      </Card>
    );
  }

  // ── Case: Cả hai tìm được đường (bình thường) ──────────────
  const astarFaster = result.astar.execution_time < result.dijkstra.execution_time;
  const astarLessNodes = result.astar.nodes_visited < result.dijkstra.nodes_visited;

  return (
    <Card className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl p-5 w-80 animate-in slide-in-from-right-8 duration-500 border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Kết quả so sánh
        </h4>
        <Button variant="ghost" size="icon" onClick={() => setIsSummaryCollapsed(true)} className="h-6 w-6 text-slate-400" title="Thu gọn">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tiêu đề kết quả */}
      <div className="mb-4">
        {astarFaster && astarLessNodes ? (
          <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2 mb-1">🏆 A* hiệu quả hơn</h3>
        ) : astarFaster ? (
          <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2 mb-1">🏆 A* nhanh hơn</h3>
        ) : astarLessNodes ? (
          <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2 mb-1">🏆 A* duyệt ít nút hơn</h3>
        ) : (
          <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2 mb-1">🏆 Dijkstra hiệu quả hơn</h3>
        )}
        {result.comparison.time_improvement_pct > 0 && (
          <p className="text-sm font-medium text-slate-600">Nhanh hơn ~{result.comparison.time_improvement_pct}%</p>
        )}
        {result.comparison.nodes_improvement_pct > 0 && (
          <p className="text-sm font-medium text-slate-600">Duyệt ít hơn ~{result.comparison.nodes_improvement_pct}%</p>
        )}
      </div>

      {/* Bảng số liệu */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm border border-slate-100">
        <MetricsTable
          result={result}
          astarFaster={astarFaster}
          astarLessNodes={astarLessNodes}
        />
      </div>

      {/* Toggle lý thuyết */}
      <button
        onClick={() => setShowTheory(!showTheory)}
        className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 mb-3 transition-colors"
      >
        <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Xem phân tích lý thuyết</span>
        {showTheory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showTheory && (
        <div className="mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-800 animate-in fade-in duration-200">
          <p className="font-bold mb-1.5">Dijkstra vs A* — Lý thuyết:</p>
          <ul className="space-y-1 text-indigo-700">
            <li>• <strong>Dijkstra:</strong> f(n) = g(n) — duyệt đồng đều mọi hướng</li>
            <li>• <strong>A*:</strong> f(n) = g(n) + h(n) — hướng đến đích</li>
            <li>• Heuristic h(n) là khoảng cách chim bay → admissible</li>
            <li>• Cả hai đều optimal: đường đi tìm được là ngắn nhất</li>
          </ul>
        </div>
      )}

      <Button
        onClick={() => setShowDetailModal(true)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 mt-1"
      >
        Xem phân tích chi tiết <StepForward className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}

// ── Bảng chỉ số (DataTable) ───────────────────────────────────────────────

interface MetricsRow {
  label: string;
  dijkstra: React.ReactNode;
  astar: React.ReactNode;
}

function MetricsTable({
  result,
  astarFaster,
  astarLessNodes,
}: {
  result: RealCompareResult;
  astarFaster: boolean;
  astarLessNodes: boolean;
}) {
  const columns: ColumnDef<MetricsRow, unknown>[] = [
    {
      accessorKey: "label",
      header: () => <span></span>,
      cell: ({ row }) => <span className="text-left text-slate-500 font-sans font-medium">{row.original.label}</span>,
    },
    {
      accessorKey: "dijkstra",
      header: () => <span className="text-right block font-medium text-blue-600">Dijkstra</span>,
      cell: ({ row }) => <div className="text-right font-mono">{row.original.dijkstra}</div>,
    },
    {
      accessorKey: "astar",
      header: () => <span className="text-right block font-medium text-teal-600">A*</span>,
      cell: ({ row }) => <div className="text-right font-mono">{row.original.astar}</div>,
    },
  ];

  const rows: MetricsRow[] = [
    {
      label: "Thời gian",
      dijkstra: <span className={!astarFaster ? "text-emerald-600 font-bold" : "text-slate-600"}>{formatMs(result.dijkstra.execution_time)}</span>,
      astar: <span className={astarFaster ? "text-emerald-600 font-bold" : "text-slate-600"}>{formatMs(result.astar.execution_time)}</span>,
    },
    {
      label: "Nút duyệt",
      dijkstra: <span className={!astarLessNodes ? "text-emerald-600 font-bold" : "text-slate-600"}>{formatNumber(result.dijkstra.nodes_visited)}</span>,
      astar: <span className={astarLessNodes ? "text-emerald-600 font-bold" : "text-slate-600"}>{formatNumber(result.astar.nodes_visited)}</span>,
    },
    {
      label: "Quãng đường",
      dijkstra: <span className="text-slate-600">{formatDistance(result.dijkstra.distance)}</span>,
      astar: <span className="text-slate-800">{formatDistance(result.astar.distance)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.label}
      enableSorting={false}
    />
  );
}
