"use client";

import React, { useState } from "react";
import { formatMs, formatNumber, formatDistance } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import AlgoCompareBar from "@/components/charts/AlgoCompareBar";
import {
  Lightbulb,
  XCircle,
  BookOpen,
  CheckCircle2,
  Cpu,
  Compass,
  Zap,
  Route,
  Gauge,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { RealCompareResult } from "@/lib/types";

interface RealMapComparisonResultsProps {
  result: RealCompareResult | null;
}

interface TheoryRow {
  criteria: string;
  dijkstra: React.ReactNode;
  astar: React.ReactNode;
}

const theoryColumns: ColumnDef<TheoryRow, unknown>[] = [
  {
    accessorKey: "criteria",
    header: "Tiêu chí",
    cell: ({ row }) => (
      <span className="font-semibold text-slate-700 text-xs uppercase">
        {row.original.criteria}
      </span>
    ),
  },
  {
    accessorKey: "dijkstra",
    header: () => (
      <span className="text-center block font-bold text-blue-700 text-sm">
        Dijkstra
      </span>
    ),
    cell: ({ row }) => <div className="text-center">{row.original.dijkstra}</div>,
  },
  {
    accessorKey: "astar",
    header: () => (
      <span className="text-center block font-bold text-cyan-700 text-sm">
        A* (Khoảng cách chim bay)
      </span>
    ),
    cell: ({ row }) => <div className="text-center">{row.original.astar}</div>,
  },
];

const theoryRows: TheoryRow[] = [
  {
    criteria: "Loại thuật toán",
    dijkstra: <span className="text-slate-600">Uninformed (Mù — duyệt tỏa tròn đồng tâm)</span>,
    astar: <span className="text-slate-700 font-medium">Informed (Có định hướng GPS tới đích)</span>,
  },
  {
    criteria: "Hàm đánh giá",
    dijkstra: <span className="font-mono text-blue-700 font-semibold">f(n) = g(n)</span>,
    astar: <span className="font-mono text-cyan-700 font-semibold">f(n) = g(n) + h(n)</span>,
  },
  {
    criteria: "Hàm Heuristic h(n)",
    dijkstra: <span className="text-slate-500">h(n) ≡ 0 (Không sử dụng)</span>,
    astar: (
      <span className="text-slate-700">
        Khoảng cách trắc địa chim bay (Haversine/Euclidean GPS)
      </span>
    ),
  },
  {
    criteria: "Tính chấp nhận (Admissible)",
    dijkstra: <span className="text-emerald-600 font-semibold">✅ Trivially (h = 0)</span>,
    astar: (
      <span className="text-emerald-600 font-semibold">
        ✅ Luôn đúng (đường chim bay luôn $\le$ đường bộ thực tế)
      </span>
    ),
  },
  {
    criteria: "Tính tối ưu (Optimality)",
    dijkstra: <span className="text-emerald-600 font-semibold">✅ Tìm được đường ngắn nhất</span>,
    astar: (
      <span className="text-emerald-600 font-semibold">
        ✅ Đảm bảo tối ưu 100% nhờ h admissible
      </span>
    ),
  },
  {
    criteria: "Không gian duyệt trên OSM",
    dijkstra: <span className="text-red-500 font-semibold">Lan tỏa 360° mọi hướng không cần thiết</span>,
    astar: <span className="text-emerald-600 font-semibold">Tập trung hình mũi tên nhắm về phía đích</span>,
  },
  {
    criteria: "Ứng dụng thực tế",
    dijkstra: <span className="text-slate-600 text-xs">Tìm trạm xăng/bệnh viện gần nhất bất kỳ</span>,
    astar: <span className="text-slate-600 text-xs">Dẫn đường GPS từ A đến B (Google Maps, OSRM)</span>,
  },
];

export default function RealMapComparisonResults({ result }: RealMapComparisonResultsProps) {
  const [openTheoryDialog, setOpenTheoryDialog] = useState(false);

  if (!result || !result.comparison) return null;

  const { dijkstra, astar, comparison } = result;
  const dijkstraFound = dijkstra.found !== false;
  const astarFound = astar.found !== false;
  const bothNotFound = !dijkstraFound && !astarFound;
  const oneNotFound = !dijkstraFound || !astarFound;

  const astarWinsNodes = astarFound && dijkstraFound && astar.nodes_visited < dijkstra.nodes_visited;
  const astarWinsTime = astarFound && dijkstraFound && astar.execution_time < dijkstra.execution_time;
  const timeDiff = dijkstra.execution_time - astar.execution_time;

  // ── Badge người chiến thắng ─────────────────────────────
  const renderSummaryBadge = () => {
    if (bothNotFound) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 text-xs py-1 px-3 font-semibold">
          ❌ Cả hai không tìm được đường
        </Badge>
      );
    }
    if (!dijkstraFound) {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-xs py-1 px-3 font-semibold">
          ⚠️ Dijkstra không tìm được đường
        </Badge>
      );
    }
    if (!astarFound) {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-xs py-1 px-3 font-semibold">
          ⚠️ A* không tìm được đường
        </Badge>
      );
    }
    if (astarWinsNodes && astarWinsTime) {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs py-1 px-3 font-semibold">
          🏆 A* vượt trội: Nhanh hơn {comparison.time_improvement_pct}% &amp; duyệt ít nút hơn {comparison.nodes_improvement_pct}%
        </Badge>
      );
    }
    if (astarWinsNodes) {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs py-1 px-3 font-semibold">
          🏆 A* tối ưu hơn: Tiết kiệm {comparison.nodes_improvement_pct}% số node duyệt
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs py-1 px-3 font-semibold">
        🏆 Dijkstra nhanh hơn trong ngữ cảnh này
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm mt-6">
      {/* ── Header: Tiêu đề, Badge & Nút mở Tra cứu lý thuyết ── */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-bold text-slate-800">
            Kết Quả So Sánh Thực Nghiệm (OSM Graph Benchmark)
          </CardTitle>
          {renderSummaryBadge()}
        </div>

        {/* Dialog Tra Cứu Lý Thuyết */}
        <Dialog open={openTheoryDialog} onOpenChange={setOpenTheoryDialog}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>📖 Xem Phân Tích Lý Thuyết</span>
              </Button>
            }
          />
          <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Cơ Sở Lý Thuyết: Dijkstra vs A* trên Bản Đồ Thực Tế
              </DialogTitle>
            </DialogHeader>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DataTable columns={theoryColumns} data={theoryRows} enableSorting={false} />
            </div>
            <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
              <strong>💡 Nguyên lý trắc địa học:</strong> Khoảng cách đường thẳng chim bay (Haversine/Euclidean) giữa 2 tọa độ GPS luôn nhỏ hơn hoặc bằng khoảng cách đường bộ thực tế qua mạng lưới giao thông. Do đó, hàm Heuristic này thỏa mãn tính chất <strong>Admissible</strong> (không bao giờ đánh giá quá cao chi phí thực), đảm bảo A* luôn tìm được đường đi ngắn nhất với thời gian và số bước duyệt giảm thiểu tối đa.
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 bg-slate-50/40 space-y-6">
        {/* ── Cả hai không tìm được đường ── */}
        {bothNotFound && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <XCircle className="w-14 h-14 text-red-300" />
            <p className="text-red-600 font-bold text-lg">Không tìm được đường đi</p>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              Không tìm thấy tuyến đường nối giữa 2 vị trí đã chọn trong dữ liệu OpenStreetMap khu vực này. Hãy thử chọn các điểm gần trục đường chính hơn.
            </p>
          </div>
        )}

        {/* ── Một trong hai không tìm được đường ── */}
        {oneNotFound && !bothNotFound && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {!dijkstraFound ? "Dijkstra" : "A*"} không tìm được đường đi
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Thuật toán còn lại đã tìm được đường. Kết quả này có thể do một chiều đường hoặc kết nối đồ thị phân mảnh.
              </p>
            </div>
          </div>
        )}

        {/* ── 1. Biểu đồ thanh 3 chỉ số chính ── */}
        {dijkstraFound && astarFound && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <AlgoCompareBar
                label="Nút Đã Duyệt (Visited)"
                dijkstra={dijkstra.nodes_visited}
                astar={astar.nodes_visited}
                formatValue={(v) => formatNumber(v)}
                improvement={astarWinsNodes ? `↓ ${comparison.nodes_improvement_pct}%` : undefined}
              />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <AlgoCompareBar
                label="Thời Gian Tính Toán"
                dijkstra={dijkstra.execution_time}
                astar={astar.execution_time}
                formatValue={(v) => formatMs(v)}
                improvement={timeDiff > 0 ? `↓ ${comparison.time_improvement_pct}%` : undefined}
              />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <AlgoCompareBar
                label="Quãng Đường Thực Tế"
                dijkstra={dijkstra.distance}
                astar={astar.distance}
                formatValue={(v) => formatDistance(v)}
                equal={comparison.same_distance}
              />
            </div>
          </div>
        )}

        {/* ── 2. Insight Box ── */}
        {dijkstraFound && astarFound && (
          <div className="bg-amber-50/80 border border-amber-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
            <div className="bg-amber-100 p-2.5 rounded-xl shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h5 className="text-sm font-bold text-slate-800">
                {astarWinsNodes ? (
                  <>
                    💡 A* duyệt ít hơn{" "}
                    <span className="text-emerald-600 font-bold">
                      {comparison.nodes_improvement_pct}%
                    </span>{" "}
                    số nút giao thông so với Dijkstra{comparison.same_distance ? " nhưng vẫn đảm bảo tìm được lộ trình tối ưu tương đương." : "."}
                  </>
                ) : (
                  "💡 Dijkstra và A* có hiệu năng tương đương trên đoạn tuyến này."
                )}
              </h5>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Trên mạng lưới đường thực tế, Heuristic khoảng cách chim bay $h(Start, Goal) = {comparison.h_start ? formatDistance(comparison.h_start) : "N/A"}$ cung cấp véc-tơ định hướng chính xác cao, giúp A* loại bỏ hoàn toàn các hướng đi ngược hoặc xa đích, tiết kiệm đáng kể tài nguyên CPU và bộ nhớ.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. BẢNG MA TRẬN THÔNG SỐ KỸ THUẬT ĐẦY ĐỦ ── */}
        {dijkstraFound && astarFound && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Bảng Đối Chiếu Thông Số Kỹ Thuật Đồ Thị OSM
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Heuristic: {result.heuristic.toUpperCase()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3 px-5">Nhóm &amp; Thông số kỹ thuật</th>
                    <th className="py-3 px-5 text-center text-blue-700">Dijkstra</th>
                    <th className="py-3 px-5 text-center text-cyan-700">A* ({result.heuristic})</th>
                    <th className="py-3 px-5 text-center">Đánh giá / Độ chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* NHÓM 1: KHÔNG GIAN & ĐỒ THỊ OSM */}
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="py-2 px-5 text-xs font-bold uppercase text-slate-400">
                      1. Không Gian &amp; Đồ Thị Giao Thông (Space &amp; Graph Scale)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Số nút giao đã mở rộng (Nodes Expanded / Visited)
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-blue-700">
                      {formatNumber(dijkstra.nodes_visited)}
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {formatNumber(astar.nodes_visited)}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {astarWinsNodes ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> A* tiết kiệm {comparison.nodes_improvement_pct}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Tương đương</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Số nút giao đã sinh vào Frontier (Nodes Generated)
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {formatNumber(dijkstra.nodes_generated || dijkstra.nodes_visited)}
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {formatNumber(astar.nodes_generated || astar.nodes_visited)}
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      {comparison.generated_improvement_pct && comparison.generated_improvement_pct > 0 ? (
                        <span className="text-emerald-600 font-medium">A* sinh ít hơn {comparison.generated_improvement_pct}%</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      Đỉnh bộ nhớ hàng đợi Heap (Peak Memory)
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {formatNumber(dijkstra.peak_memory || 0)} nodes
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {formatNumber(astar.peak_memory || 0)} nodes
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      {comparison.memory_improvement_pct && comparison.memory_improvement_pct > 0 ? (
                        <span className="text-emerald-600 font-medium">A* giảm RAM {comparison.memory_improvement_pct}%</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Tỷ lệ phủ đồ thị thành phố (Graph Coverage Rate)
                    </td>
                    <td className="py-3 px-5 text-center font-mono text-slate-700">
                      {dijkstra.map_coverage_pct ?? "—"}%
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {astar.map_coverage_pct ?? "—"}%
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      {dijkstra.map_coverage_pct && astar.map_coverage_pct ? (
                        <span className="text-slate-600 font-medium">
                          A* tập trung gấp {(dijkstra.map_coverage_pct / Math.max(0.001, astar.map_coverage_pct)).toFixed(1)} lần
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>

                  {/* NHÓM 2: HIỆU QUẢ TÌM KIẾM & ĐỘ LỆCH DETOUR */}
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="py-2 px-5 text-xs font-bold uppercase text-slate-400">
                      2. Hiệu Quả Tìm Kiếm &amp; Chất Lượng Lộ Trình (Search Efficiency &amp; Detour)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-600" />
                      Hiệu quả tìm kiếm (Search Penetrance: Steps / Visited)
                    </td>
                    <td className="py-3 px-5 text-center font-mono text-slate-700">
                      {dijkstra.search_penetrance_pct ?? "—"}%
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-emerald-600">
                      {astar.search_penetrance_pct ?? "—"}%
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      <span className="text-emerald-700 font-semibold">
                        A* có độ nhắm trúng lộ trình cao hơn
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <Route className="w-4 h-4 text-purple-500" />
                      Quãng đường thực tế trên đường bộ (Road Distance)
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold">
                      {formatDistance(dijkstra.distance)}
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold">
                      {formatDistance(astar.distance)}
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      {comparison.same_distance ? (
                        <span className="text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          ✅ Tối ưu tương đương 100%
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Chênh lệch nhỏ</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      Khoảng cách chim bay Haversine h(Start, Goal)
                    </td>
                    <td className="py-3 px-5 text-center font-mono text-slate-400">
                      — (Không dùng)
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {comparison.h_start ? formatDistance(comparison.h_start) : "—"}
                    </td>
                    <td className="py-3 px-5 text-center text-xs text-slate-500">
                      Khoảng cách đường thẳng địa lý
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Hệ số quanh co (Detour Index: Road / Straight)
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {dijkstra.detour_index ?? "—"}x
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-slate-800">
                      {astar.detour_index ?? "—"}x
                    </td>
                    <td className="py-3 px-5 text-center text-xs text-slate-500">
                      Đo mức độ quanh co của mạng lưới giao thông ($\ge 1.0$)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      Số chặng nút giao trên đường đi (Steps count)
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {dijkstra.steps} chặng
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {astar.steps} chặng
                    </td>
                    <td className="py-3 px-5 text-center text-xs text-slate-500">
                      Số đoạn kết nối giữa các ngã rẽ
                    </td>
                  </tr>

                  {/* NHÓM 3: THỜI GIAN & THÔNG LƯỢNG */}
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="py-2 px-5 text-xs font-bold uppercase text-slate-400">
                      3. Tốc Độ &amp; Thông Lượng Xử Lý (Speed &amp; Throughput)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Thời gian tính toán thuật toán (Execution Time)
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-blue-700">
                      {formatMs(dijkstra.execution_time)}
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-cyan-700">
                      {formatMs(astar.execution_time)}
                    </td>
                    <td className="py-3 px-5 text-center text-xs">
                      {timeDiff > 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          A* nhanh hơn {comparison.time_improvement_pct}%
                        </span>
                      ) : timeDiff < 0 ? (
                        <span className="text-blue-600 font-semibold">
                          Dijkstra nhanh hơn {Math.abs(comparison.time_improvement_pct)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">Ngang nhau</span>
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-medium flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-indigo-500" />
                      Thông lượng duyệt node (Throughput)
                    </td>
                    <td className="py-3 px-5 text-center font-mono">
                      {formatNumber(dijkstra.throughput_nodes_sec || 0)} n/s
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-semibold text-indigo-700">
                      {formatNumber(astar.throughput_nodes_sec || 0)} n/s
                    </td>
                    <td className="py-3 px-5 text-center text-xs text-slate-500">
                      Số nút đồ thị xử lý trong 1 giây
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
