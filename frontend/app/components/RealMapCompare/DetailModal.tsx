import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BarChart,
  X,
  Timer,
  Brain,
  TrendingDown,
  Route,
  CheckCircle2,
  Activity,
  MapPin,
} from "lucide-react";
import { formatMs, formatDistance, formatNumber } from "@/lib/utils";
import type { RealCompareResult } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";

interface DetailModalProps {
  showDetailModal: boolean;
  setShowDetailModal: (val: boolean) => void;
  result: any;
}

export default function DetailModal({
  showDetailModal,
  setShowDetailModal,
  result,
}: DetailModalProps) {
  if (!showDetailModal || !result?.comparison) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Modal Header (Sticky) */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800  ">
                Phân Tích Chuyên Sâu
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Báo cáo so sánh chi tiết: Dijkstra vs A*
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetailModal(false)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden group border border-indigo-500">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Timer className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-200 mb-4">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase     r">
                    Tối ưu Thời Gian
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black">
                    {formatMs(result.dijkstra.execution_time)} →{" "}
                    {formatMs(result.astar.execution_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-blue-200">
                    ↓ {result.comparison.time_improvement_pct}% thời gian
                  </span>
                </div>
                <p className="text-blue-100 font-medium text-sm">
                  Thời gian xử lý nhanh hơn Dijkstra
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200/50 relative overflow-hidden group border border-teal-500">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Brain className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-teal-100 mb-4">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase     r">
                    Tối ưu Không Gian
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black">
                    {formatNumber(result.dijkstra.nodes_visited)} →{" "}
                    {formatNumber(result.astar.nodes_visited)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-teal-200">
                    ↓ {result.comparison.nodes_improvement_pct}% nút duyệt
                  </span>
                </div>
                <p className="text-teal-50 font-medium text-sm">
                  Số lượng nút cần duyệt ít hơn đáng kể
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Comparison Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200 px-6 py-4">
              <div className="col-span-4 text-sm font-bold text-slate-400 uppercase     r">
                Chỉ Số Phân Tích
              </div>
              <div className="col-span-4 text-sm font-bold text-blue-700 text-center flex flex-col sm:block">
                Dijkstra{" "}
                <span className="font-medium text-slate-400 text-sm sm:ml-1">
                  (Baseline)
                </span>
              </div>
              <div className="col-span-4 text-sm font-bold text-teal-700 text-center flex flex-col sm:block">
                A*{" "}
                <span className="font-medium text-teal-600/70 text-sm sm:ml-1">
                  ({result.heuristic})
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {/* Distance */}
              <div className="grid grid-cols-12 items-center px-6 py-5 hover:bg-slate-50/50 transition">
                <div className="col-span-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg hidden sm:block">
                    <Route className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm sm:text-base">
                    Quãng đường
                  </span>
                </div>
                <div className="col-span-4 text-center font-mono text-base sm:text-lg font-medium text-slate-600">
                  {formatDistance(result.dijkstra.distance)}
                </div>
                <div className="col-span-4 text-center font-mono text-base sm:text-lg font-medium text-slate-600 flex flex-col items-center justify-center">
                  {formatDistance(result.astar.distance)}
                  {result.comparison.same_distance ? (
                    <span className="text-[13px] sm:text-[13px] font-bold text-emerald-500 uppercase mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 hidden sm:block" /> Tối
                      ưu tương đương
                    </span>
                  ) : result.astar.distance > result.dijkstra.distance ? (
                    <span className="text-[13px] sm:text-[13px] font-bold text-amber-500 mt-1 flex items-center gap-1">
                      +
                      {formatDistance(
                        result.astar.distance - result.dijkstra.distance,
                      )}{" "}
                      (+
                      {(
                        ((result.astar.distance - result.dijkstra.distance) /
                          result.dijkstra.distance) *
                        100
                      ).toFixed(2)}
                      %)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-12 items-center px-6 py-5 hover:bg-slate-50/50 transition">
                <div className="col-span-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg hidden sm:block">
                    <Timer className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm sm:text-base">
                    Thời gian thực thi
                  </span>
                </div>
                <div className="col-span-4 text-center font-mono text-base sm:text-lg font-medium text-slate-500">
                  {formatMs(result.dijkstra.execution_time)}
                </div>
                <div className="col-span-4 text-center font-mono text-lg sm:text-xl font-bold text-blue-600 flex flex-col items-center justify-center">
                  {formatMs(result.astar.execution_time)}
                  <span className="text-[13px] sm:text-[13px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full mt-1 text-center leading-tight">
                    Nhanh hơn {result.comparison.time_improvement_pct}%
                  </span>
                </div>
              </div>

              {/* Nodes */}
              <div className="grid grid-cols-12 items-center px-6 py-5 hover:bg-slate-50/50 transition">
                <div className="col-span-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-teal-50 text-teal-500 rounded-lg hidden sm:block">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm sm:text-base">
                    Số nút duyệt
                  </span>
                </div>
                <div className="col-span-4 text-center font-mono text-base sm:text-lg font-medium text-slate-500">
                  {formatNumber(result.dijkstra.nodes_visited)}
                </div>
                <div className="col-span-4 text-center font-mono text-lg sm:text-xl font-bold text-teal-600 flex flex-col items-center justify-center">
                  {formatNumber(result.astar.nodes_visited)}
                  <span className="text-[13px] sm:text-[13px] font-bold text-white bg-teal-500 px-2 py-0.5 rounded-full mt-1 text-center leading-tight">
                    Giảm {result.comparison.nodes_improvement_pct}%
                  </span>
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition bg-slate-50/30">
                <div className="col-span-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg hidden sm:block">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm sm:text-base">
                    Số bước
                  </span>
                </div>
                <div className="col-span-4 text-center font-mono text-sm sm:text-base font-medium text-slate-500">
                  {formatNumber(result.dijkstra.steps)}
                </div>
                <div className="col-span-4 text-center font-mono text-sm sm:text-base font-medium text-slate-600">
                  {formatNumber(result.astar.steps)}
                </div>
              </div>
            </div>
          </div>
          {/* Theory Analysis Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
              <h4 className="text-base font-bold text-indigo-800 flex items-center gap-2">
                📚 Phân Tích Lý Thuyết — Dijkstra vs A*
              </h4>
              <p className="text-sm text-indigo-600 mt-0.5 font-medium">
                Giải thích tại sao kết quả thực nghiệm lại như vậy
              </p>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <TheoryTable result={result} />
            </div>

            {/* Key insight */}
            <div className="px-6 py-5 bg-linear-to-r from-amber-50 to-orange-50 border-t border-amber-100 space-y-3">
              <p className="text-sm font-bold text-amber-800">
                🔍 Giải thích kết quả:
              </p>
              <p className="text-sm text-amber-700">
                A* duyệt ít hơn{" "}
                <strong>{result.comparison.nodes_improvement_pct}%</strong> so
                với Dijkstra vì heuristic h(n) = khoảng cách đường chim bay giúp
                loại trừ các hướng đi xa khỏi đích. Cả hai tìm được đường ngắn
                nhất vì h(n) là <strong>admissible</strong> (không
                overestimate).
              </p>
              <p className="text-sm text-amber-700">
                <strong>Quan sát quan trọng:</strong> Quãng đường tìm được gần
                như bằng nhau (
                {result.comparison.same_distance
                  ? "tương đương"
                  : "chênh lệch nhỏ do xấp xỉ floating point"}
                ), chứng minh A* với admissible heuristic đảm bảo tính optimal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bảng lý thuyết (DataTable) ───────────────────────────────────────────

interface TheoryRow {
  criteria: string;
  dijkstra: React.ReactNode;
  astar: React.ReactNode;
}

function TheoryTable({ result }: { result: RealCompareResult }) {
  const columns: ColumnDef<TheoryRow, unknown>[] = [
    {
      accessorKey: "criteria",
      header: "Tiêu chí",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-600 text-xs uppercase">
          {row.original.criteria}
        </span>
      ),
    },
    {
      accessorKey: "dijkstra",
      header: () => (
        <span className="text-center block font-bold text-blue-700">
          Dijkstra
        </span>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.dijkstra}</div>
      ),
    },
    {
      accessorKey: "astar",
      header: () => (
        <span className="text-center block font-bold text-teal-700">
          A* ({result.heuristic})
        </span>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.astar}</div>
      ),
    },
  ];

  const rows: TheoryRow[] = [
    {
      criteria: "Hàm đánh giá",
      dijkstra: (
        <span className="font-mono text-blue-700 font-semibold">
          f(n) = g(n)
        </span>
      ),
      astar: (
        <span className="font-mono text-teal-700 font-semibold">
          f(n) = g(n) + h(n)
        </span>
      ),
    },
    {
      criteria: "Chiến lược",
      dijkstra: (
        <span className="text-slate-600 text-xs">
          Mở rộng đồng đều
          <br />
          ra mọi hướng
        </span>
      ),
      astar: (
        <span className="text-slate-600 text-xs">
          Tập trung về hướng
          <br />
          có h(n) nhỏ nhất
        </span>
      ),
    },
    {
      criteria: "Heuristic h(n)",
      dijkstra: <span className="text-slate-500">h(n) ≡ 0 (không dùng)</span>,
      astar: (
        <span className="text-slate-700 text-xs">
          Khoảng cách chim bay
          <br />
          (đường thẳng GPS)
        </span>
      ),
    },
    {
      criteria: "Admissible?",
      dijkstra: (
        <span className="text-emerald-600 font-semibold">✅ Trivially</span>
      ),
      astar: (
        <span className="text-emerald-600 font-semibold">
          ✅ Có (chim bay ≤ thực)
        </span>
      ),
    },
    {
      criteria: "Optimal?",
      dijkstra: (
        <span className="text-emerald-600 font-semibold">✅ Luôn luôn</span>
      ),
      astar: (
        <span className="text-emerald-600 font-semibold">
          ✅ Vì h admissible
        </span>
      ),
    },
    {
      criteria: "Node duyệt",
      dijkstra: (
        <span className="text-red-500 font-semibold">
          {formatNumber(result.dijkstra.nodes_visited)} node
        </span>
      ),
      astar: (
        <span className="text-teal-600 font-semibold">
          {formatNumber(result.astar.nodes_visited)} node
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.criteria}
      enableSorting={false}
    />
  );
}
