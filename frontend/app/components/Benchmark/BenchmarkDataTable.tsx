"use client";

import React, { useState } from "react";
import { Search, Compass, ArrowUpDown } from "lucide-react";
import type { BenchmarkRun } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMs, formatNumber } from "@/lib/utils";

interface BenchmarkDataTableProps {
  runs: BenchmarkRun[];
  onSelectRunForVisual: (runNum: number) => void;
}

export default function BenchmarkDataTable({
  runs,
  onSelectRunForVisual,
}: BenchmarkDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof BenchmarkRun>("run");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Filter
  const filteredRuns = runs.filter((r) => {
    if (!searchTerm) return true;
    return (
      String(r.run).includes(searchTerm) || String(r.seed).includes(searchTerm)
    );
  });

  // Sort
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedRuns.length / pageSize);
  const paginatedRuns = sortedRuns.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleSort = (field: keyof BenchmarkRun) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent>
        {/* Header with Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Chi Tiết Toàn Bộ {runs.length} Lượt Chạy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bảng số liệu đối chiếu 12 thông số thực nghiệm giữa Dijkstra và A*
            </p>
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm lượt # hoặc seed..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-8 w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort("run")}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    # <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Seed</th>
                <th
                  onClick={() => handleSort("dijkstra_time")}
                  className="py-3 px-3 text-blue-600 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Dijkstra Time{" "}
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("astar_time")}
                  className="py-3 px-3 text-emerald-600 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    A* Time <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("dijkstra_nodes")}
                  className="py-3 px-3 text-blue-600 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Dijkstra Nodes{" "}
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("astar_nodes")}
                  className="py-3 px-3 text-emerald-600 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    A* Nodes <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Tiết Kiệm Nút</th>
                <th className="py-3 px-3 text-center">Tăng Tốc</th>
                <th className="py-3 px-3 text-right">Trực Quan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRuns.map((r) => {
                const diffNodes = r.dijkstra_nodes - r.astar_nodes;
                const diffPct =
                  r.dijkstra_nodes > 0
                    ? Number(((diffNodes / r.dijkstra_nodes) * 100).toFixed(1))
                    : 0;
                const speedup =
                  r.astar_time > 0
                    ? Number((r.dijkstra_time / r.astar_time).toFixed(2))
                    : 1.0;

                return (
                  <tr
                    key={r.run}
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-500">
                      #{r.run}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {r.seed}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {formatMs(r.dijkstra_time)}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                      {formatMs(r.astar_time)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {formatNumber(r.dijkstra_nodes)}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                      {formatNumber(r.astar_nodes)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          diffPct >= 0
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        {diffPct >= 0
                          ? `↓ ${diffPct}%`
                          : `↑ ${Math.abs(diffPct)}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-indigo-600 font-bold">
                      {speedup}×
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectRunForVisual(r.run)}
                        className="px-2 py-1 rounded-md text-[11px] font-sans font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                        title="Xem mô phỏng bản đồ của ván này"
                      >
                        <Compass className="w-3 h-3" />
                        Xem map
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 text-xs text-slate-500">
            <span>
              Hiển thị {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, sortedRuns.length)} trên{" "}
              {sortedRuns.length} lượt
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2.5 text-xs"
              >
                Trước
              </Button>
              <span className="px-2 font-mono text-xs">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2.5 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
