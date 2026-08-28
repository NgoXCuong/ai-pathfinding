"use client";

import React from "react";
import { formatMs, formatNumber } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowDown, ArrowUp, Equal, XCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ComparisonResultsProps {
  results: any;
}

export default function ComparisonResults({ results }: ComparisonResultsProps) {
  const [showTheory, setShowTheory] = useState(false);

  if (!results || !results.comparison) return null;

  const { dijkstra, astar, comparison } = results;
  const dijkstraFound = dijkstra.found !== false;
  const astarFound = astar.found !== false;
  const bothNotFound = !dijkstraFound && !astarFound;
  const oneNotFound = !dijkstraFound || !astarFound;

  const astarWinsNodes = astarFound && dijkstraFound && astar.nodes_visited < dijkstra.nodes_visited;
  const nodeDiff = dijkstra.nodes_visited - astar.nodes_visited;
  const timeDiff = dijkstra.execution_time - astar.execution_time;

  // ── Badge kết quả tổng hợp ──────────────────────────────
  const renderSummaryBadge = () => {
    if (bothNotFound) return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-sm py-0.5 px-3 font-semibold">
        ❌ Cả hai không tìm được đường
      </Badge>
    );
    if (!dijkstraFound) return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-sm py-0.5 px-3 font-semibold">
        ⚠️ Dijkstra không tìm được đường
      </Badge>
    );
    if (!astarFound) return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-sm py-0.5 px-3 font-semibold">
        ⚠️ A* không tìm được đường
      </Badge>
    );
    const astarWinsTime = astar.execution_time < dijkstra.execution_time;
    if (astarWinsNodes && astarWinsTime) return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-sm py-0.5 px-3 font-semibold">
        🏆 A* nhanh hơn &amp; duyệt ít nút hơn
      </Badge>
    );
    if (astarWinsNodes) return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-sm py-0.5 px-3 font-semibold">
        🏆 A* duyệt ít nút hơn
      </Badge>
    );
    if (astarWinsTime) return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-sm py-0.5 px-3 font-semibold">
        🏆 A* nhanh hơn
      </Badge>
    );
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-sm py-0.5 px-3 font-semibold">
        🏆 Dijkstra hiệu quả hơn
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 border-slate-200 shadow-sm mt-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <CardTitle className="text-sm font-semibold text-slate-800">Kết Quả So Sánh</CardTitle>
        {renderSummaryBadge()}
      </div>

      <div className="p-6 bg-slate-50/50">

        {/* ── Cả hai không tìm được đường ── */}
        {bothNotFound && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <XCircle className="w-14 h-14 text-red-300" />
            <p className="text-red-600 font-bold text-lg">Không tìm được đường đi</p>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              Vật cản đã chặn hoàn toàn mọi đường đến đích. Hãy thử xóa bớt vật cản hoặc thay đổi vị trí điểm đầu/cuối.
            </p>
          </div>
        )}

        {/* ── Một trong hai không tìm được đường ── */}
        {oneNotFound && !bothNotFound && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {!dijkstraFound ? "Dijkstra" : "A*"} không tìm được đường đi
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Thuật toán còn lại đã tìm được đường. Trường hợp này thường không xảy ra
                với admissible heuristic — hãy kiểm tra lại cấu hình bản đồ.
              </p>
            </div>
          </div>
        )}

        {/* ── KPI Cards (chỉ hiển thị khi cả hai tìm được đường) ── */}
        {dijkstraFound && astarFound && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* KPI Nodes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Nút Đã Duyệt</h4>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">Dijkstra</div>
                  <div className="text-lg font-bold text-slate-800">{formatNumber(dijkstra.nodes_visited)}</div>
                </div>
                <div className="text-slate-300">
                  {astarWinsNodes ? <ArrowDown className="w-5 h-5 text-emerald-500" /> : (dijkstra.nodes_visited === astar.nodes_visited ? <Equal className="w-5 h-5" /> : <ArrowUp className="w-5 h-5 text-red-500" />)}
                </div>
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">A*</div>
                  <div className={`text-lg font-bold ${astarWinsNodes ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {formatNumber(astar.nodes_visited)}
                  </div>
                </div>
              </div>
              {astarWinsNodes && (
                <div className="mt-4 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                  ↓ {comparison.nodes_improvement_pct}%
                </div>
              )}
            </div>

            {/* KPI Time */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Thời Gian</h4>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">Dijkstra</div>
                  <div className="text-lg font-bold text-slate-800">{formatMs(dijkstra.execution_time)}</div>
                </div>
                <div className="text-slate-300">
                  {timeDiff > 0 ? <ArrowDown className="w-5 h-5 text-emerald-500" /> : <ArrowUp className="w-5 h-5 text-red-500" />}
                </div>
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">A*</div>
                  <div className={`text-lg font-bold ${timeDiff > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {formatMs(astar.execution_time)}
                  </div>
                </div>
              </div>
              {timeDiff > 0 && (
                <div className="mt-4 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                  ↓ {comparison.time_improvement_pct}%
                </div>
              )}
            </div>

            {/* KPI Path */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Độ Dài Đường Đi</h4>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">Dijkstra</div>
                  <div className="text-lg font-bold text-slate-800">{dijkstra.path?.length || 0}</div>
                </div>
                <div className="text-slate-300">
                  {comparison.same_path_length ? <Equal className="w-5 h-5 text-emerald-500" /> : <span className="text-slate-400 font-bold">vs</span>}
                </div>
                <div className="text-center">
                  <div className="text-[13px] text-slate-500 font-medium mb-1">A*</div>
                  <div className="text-lg font-bold text-slate-800">{astar.path?.length || 0}</div>
                </div>
              </div>
              <div className={`mt-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold ${comparison.same_path_length ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {comparison.same_path_length ? "✓ Kết quả tương đương" : "Khác biệt"}
              </div>
            </div>
          </div>
        )}

        {/* ── Insight Box ── */}
        {dijkstraFound && astarFound && (
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm mb-4">
            <div className="bg-amber-100 p-2.5 rounded-xl shrink-0 mt-0.5">
              <Lightbulb className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h5 className="text-[13px] font-semibold text-slate-800">
                {astarWinsNodes ? (
                  <>💡 A* duyệt ít hơn <span className="text-emerald-600 font-bold">{comparison.nodes_improvement_pct}%</span> số nút so với Dijkstra{comparison.same_path_length ? " nhưng vẫn tìm được đường đi tương đương." : "."}</>
                ) : timeDiff < 0 ? (
                  "💡 Trong trường hợp này, Dijkstra nhanh hơn A*. Điều này xảy ra khi overhead tính heuristic lớn hơn lợi ích (grid nhỏ, vật cản phức tạp)."
                ) : (
                  "💡 A* không mang lại lợi thế về số nút duyệt trong trường hợp này."
                )}
              </h5>
              <p className="text-slate-600 text-[13px] font-normal mt-1">
                {astarWinsNodes
                  ? "Heuristic giúp A* tập trung tìm kiếm về phía đích thay vì mở rộng đồng đều ra mọi hướng như Dijkstra."
                  : "Vật cản có thể tạo thành dạng hình học phức tạp khiến heuristic dẫn A* đi sai hướng ban đầu, buộc phải quay lui thêm."}
              </p>
            </div>
          </div>
        )}

        {/* ── Bảng lý thuyết (collapsible) ── */}
        <button
          onClick={() => setShowTheory(!showTheory)}
          className="w-full flex items-center justify-between px-5 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Phân tích lý thuyết: Dijkstra vs A*
          </span>
          {showTheory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showTheory && (
          <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-800 uppercase">So Sánh Lý Thuyết</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 font-semibold text-slate-500 uppercase text-xs">Tiêu chí</th>
                    <th className="text-center px-6 py-3 font-bold text-blue-700 text-sm">Dijkstra</th>
                    <th className="text-center px-6 py-3 font-bold text-cyan-700 text-sm">A*</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Loại thuật toán</td>
                    <td className="px-6 py-3.5 text-center text-slate-600">Uninformed (mù)</td>
                    <td className="px-6 py-3.5 text-center text-slate-600">Informed (có hướng dẫn)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Hàm đánh giá</td>
                    <td className="px-6 py-3.5 text-center font-mono text-blue-700 font-semibold">f(n) = g(n)</td>
                    <td className="px-6 py-3.5 text-center font-mono text-cyan-700 font-semibold">f(n) = g(n) + h(n)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Dùng heuristic?</td>
                    <td className="px-6 py-3.5 text-center text-slate-500">❌ Không</td>
                    <td className="px-6 py-3.5 text-center text-slate-700">✅ Có (h(n) ước lượng đến đích)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Tối ưu (Optimal)?</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">✅ Luôn luôn</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">✅ Khi h admissible</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Đầy đủ (Complete)?</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">✅ Có</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">✅ Có</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Độ phức tạp</td>
                    <td className="px-6 py-3.5 text-center font-mono text-slate-600">O((V+E) log V)</td>
                    <td className="px-6 py-3.5 text-center font-mono text-slate-600">O((V+E) log V)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Số node duyệt</td>
                    <td className="px-6 py-3.5 text-center text-red-500 font-semibold">Nhiều hơn (mọi hướng)</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">Ít hơn (hướng đến đích)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase">Phù hợp khi nào</td>
                    <td className="px-6 py-3.5 text-center text-slate-600 text-xs">Không biết vị trí đích<br/>Không gian phi hình học</td>
                    <td className="px-6 py-3.5 text-center text-slate-600 text-xs">Biết vị trí đích<br/>Không gian hình học (bản đồ)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-100">
              <p className="text-xs text-amber-700 font-medium">
                <span className="font-bold">Kết luận:</span> A* luôn duyệt ≤ số node của Dijkstra trên cùng bài toán (với heuristic admissible).
                Với h(n) ≡ 0, A* trở thành Dijkstra. Heuristic càng chính xác, A* càng hiệu quả hơn.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
