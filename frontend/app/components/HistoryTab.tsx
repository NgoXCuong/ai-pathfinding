"use client";

import React, { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  History,
  RotateCcw,
  Trash2,
  Clock,
  Grid3X3,
  Map,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
  Eye,
  Trophy,
  Zap,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  ArrowDown,
  Filter,
} from "lucide-react";
import { formatMs, formatTimeAgo } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

interface HistoryTabProps {
  historyList: HistoryItem[];
  historyLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onClearAll?: () => void;
  onNavigateCompare?: () => void;
}

// ─── Helper: Tính toán đối đầu giữa Dijkstra vs A* ───────────────────────────
function getComparisonStats(item: HistoryItem) {
  const astar = item.results.find((r) => r.algorithm === "astar");
  const dijk = item.results.find((r) => r.algorithm === "dijkstra");

  const dijkNodes = dijk?.nodes_visited ?? 0;
  const astarNodes = astar?.nodes_visited ?? 0;
  const nodesSaved = dijkNodes - astarNodes;
  const nodesSavedPct = dijkNodes > 0 ? (nodesSaved / dijkNodes) * 100 : 0;

  const dijkTime = dijk?.execution_time ?? 0;
  const astarTime = astar?.execution_time ?? 0;
  const timeDiff = dijkTime - astarTime;
  const timeSpeedup = astarTime > 0 ? dijkTime / astarTime : 1;
  const timeSavedPct = dijkTime > 0 ? (timeDiff / dijkTime) * 100 : 0;

  const dijkSteps = dijk?.steps ?? dijk?.distance ?? 0;
  const astarSteps = astar?.steps ?? astar?.distance ?? 0;
  const samePathLength = dijkSteps > 0 && Math.abs(dijkSteps - astarSteps) < 0.001;

  let winner: "astar" | "dijkstra" | "tie" = "astar";
  if (astarNodes < dijkNodes) {
    winner = "astar";
  } else if (astarNodes > dijkNodes) {
    winner = "dijkstra";
  } else {
    winner = "tie";
  }

  return {
    hasBoth: Boolean(astar && dijk),
    astar,
    dijk,
    dijkNodes,
    astarNodes,
    nodesSaved,
    nodesSavedPct,
    dijkTime,
    astarTime,
    timeDiff,
    timeSpeedup,
    timeSavedPct,
    dijkSteps,
    astarSteps,
    samePathLength,
    winner,
  };
}

export default function HistoryTab({
  historyList,
  historyLoading,
  onRefresh,
  onDelete,
  onClearAll,
  onNavigateCompare,
}: HistoryTabProps) {
  // ── Filters & Search State ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [envFilter, setEnvFilter] = useState<"all" | "grid" | "osm">("all");
  const [heuristicFilter, setHeuristicFilter] = useState<string>("all");

  // ── Pagination State ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ── Modals State ──────────────────────────────────────────────────────────
  const [inspectItem, setInspectItem] = useState<HistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Counts for quick badges ───────────────────────────────────────────────
  const gridCount = useMemo(
    () => historyList.filter((h) => h.map_type !== "osm").length,
    [historyList],
  );
  const osmCount = useMemo(
    () => historyList.filter((h) => h.map_type === "osm").length,
    [historyList],
  );

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return historyList.filter((item) => {
      // Filter theo môi trường
      if (envFilter === "grid" && item.map_type === "osm") return false;
      if (envFilter === "osm" && item.map_type !== "osm") return false;

      // Filter theo Heuristic
      const astar = item.results.find((r) => r.algorithm === "astar");
      if (
        heuristicFilter !== "all" &&
        astar?.heuristic?.toLowerCase() !== heuristicFilter.toLowerCase()
      ) {
        return false;
      }

      // Filter theo search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const idMatch = `#${item.id}`.includes(query) || `${item.id}`.includes(query);
        const envMatch =
          item.map_type === "osm"
            ? "osm real map".includes(query)
            : `grid ${item.grid_size}x${item.grid_size} ${item.grid_size}`.includes(query);
        const heurMatch = astar?.heuristic?.toLowerCase().includes(query);
        if (!idMatch && !envMatch && !heurMatch) return false;
      }

      return true;
    });
  }, [historyList, envFilter, heuristicFilter, searchTerm]);

  // ── Pagination calculations ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);

  const currentData = useMemo(() => {
    return filteredData.slice(
      (validPage - 1) * itemsPerPage,
      validPage * itemsPerPage,
    );
  }, [filteredData, validPage, itemsPerPage]);

  // ── Xuất CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (historyList.length === 0) return;

    const headers = [
      "ID",
      "Loại môi trường",
      "Chi tiết kích thước/Tọa độ",
      "Heuristic",
      "Thời điểm",
      "Dijkstra - Thời gian (ms)",
      "Dijkstra - Số node duyệt",
      "Dijkstra - Quãng đường/Bước",
      "A* - Thời gian (ms)",
      "A* - Số node duyệt",
      "A* - Quãng đường/Bước",
      "Node tiết kiệm",
      "Tỷ lệ tiết kiệm (%)",
      "Chênh lệch thời gian (ms)",
      "Tốc độ tăng tốc",
      "Thuật toán thắng",
      "Tối ưu cùng độ dài",
    ];

    const rows = filteredData.map((item) => {
      const stats = getComparisonStats(item);
      const isOsm = item.map_type === "osm";
      const envLabel = isOsm
        ? "OSM Real Map"
        : `Grid ${item.grid_size}x${item.grid_size}`;
      const envDetail = isOsm
        ? `Start: (${item.start_lat?.toFixed(5)}, ${item.start_lon?.toFixed(5)}) -> End: (${item.end_lat?.toFixed(5)}, ${item.end_lon?.toFixed(5)})`
        : `Kích thước: ${item.grid_size}x${item.grid_size}`;
      const heuristic = stats.astar?.heuristic || "N/A";
      const dateStr = new Date(item.created_at).toLocaleString("vi-VN");

      return [
        item.id,
        `"${envLabel}"`,
        `"${envDetail}"`,
        heuristic,
        `"${dateStr}"`,
        stats.dijk?.execution_time?.toFixed(2) ?? "N/A",
        stats.dijk?.nodes_visited ?? "N/A",
        stats.dijkSteps || "N/A",
        stats.astar?.execution_time?.toFixed(2) ?? "N/A",
        stats.astar?.nodes_visited ?? "N/A",
        stats.astarSteps || "N/A",
        stats.hasBoth ? stats.nodesSaved : "N/A",
        stats.hasBoth ? `${stats.nodesSavedPct.toFixed(1)}%` : "N/A",
        stats.hasBoth ? stats.timeDiff.toFixed(2) : "N/A",
        stats.hasBoth ? `${stats.timeSpeedup.toFixed(2)}x` : "N/A",
        stats.hasBoth
          ? stats.winner === "astar"
            ? "A*"
            : stats.winner === "dijkstra"
              ? "Dijkstra"
              : "Hòa"
          : "N/A",
        stats.hasBoth
          ? stats.samePathLength
            ? "Đúng (Tối ưu tuyệt đối)"
            : "Khác nhau"
          : "N/A",
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `lich_su_thuc_nghiem_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Columns cho DataTable ─────────────────────────────────────────────────
  const columns: ColumnDef<HistoryItem, unknown>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-slate-500 text-xs px-2 py-1 bg-slate-100 rounded-md">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "map_type",
      header: "Môi trường",
      cell: ({ row }) => {
        const item = row.original;
        const isOsm = item.map_type === "osm";
        const astar = item.results.find((r) => r.algorithm === "astar");
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isOsm
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "bg-purple-50 text-purple-600 border border-purple-100"
              }`}
            >
              {isOsm ? (
                <Map className="w-4 h-4" />
              ) : (
                <Grid3X3 className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-800">
                {isOsm
                  ? "OSM Real Map"
                  : `Lưới Grid ${item.grid_size}×${item.grid_size}`}
              </div>
              {astar?.heuristic && (
                <Badge
                  variant="outline"
                  className="mt-0.5 text-[10px] py-0 px-1.5 font-medium border-slate-200 text-slate-600 bg-slate-50 capitalize"
                >
                  {astar.heuristic}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Thời điểm",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTimeAgo(item.created_at)}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {new Date(item.created_at).toLocaleString("vi-VN")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "results",
      header: "Chỉ số Chi tiết",
      cell: ({ row }) => {
        const stats = getComparisonStats(row.original);
        return (
          <div className="flex flex-col gap-1.5">
            {stats.dijk && (
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] py-0 px-1.5 font-semibold w-16 justify-center"
                >
                  Dijkstra
                </Badge>
                <span className="font-mono text-slate-700 font-semibold">
                  {formatMs(stats.dijk.execution_time || 0)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {(stats.dijk.nodes_visited || 0).toLocaleString()} nodes
                </span>
                {stats.dijkSteps > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-[11px]">
                      {stats.dijkSteps}{" "}
                      {row.original.map_type === "osm" ? "km" : "bước"}
                    </span>
                  </>
                )}
              </div>
            )}
            {stats.astar && (
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="border-cyan-200 text-cyan-700 bg-cyan-50 text-[10px] py-0 px-1.5 font-semibold w-16 justify-center"
                >
                  A*
                </Badge>
                <span className="font-mono text-slate-700 font-semibold">
                  {formatMs(stats.astar.execution_time || 0)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {(stats.astar.nodes_visited || 0).toLocaleString()} nodes
                </span>
                {stats.astarSteps > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-[11px]">
                      {stats.astarSteps}{" "}
                      {row.original.map_type === "osm" ? "km" : "bước"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "comparison_delta",
      header: "Đối đầu & Tối ưu",
      cell: ({ row }) => {
        const stats = getComparisonStats(row.original);
        if (!stats.hasBoth) {
          return <span className="text-xs text-slate-400">—</span>;
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {stats.winner === "astar" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  A* Thắng
                </span>
              ) : stats.winner === "tie" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <Zap className="w-3 h-3 text-blue-500" />
                  Tương đương
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  Dijkstra Thắng
                </span>
              )}

              {stats.nodesSavedPct > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 font-mono bg-emerald-50/80 px-1.5 py-0.5 rounded">
                  <ArrowDown className="w-3 h-3" />
                  {stats.nodesSavedPct.toFixed(1)}% nodes
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {stats.timeSpeedup > 1.05 ? (
                <span className="text-blue-600 font-medium">
                  Nhanh hơn {stats.timeSpeedup.toFixed(1)}×
                </span>
              ) : stats.timeSavedPct > 0 ? (
                <span className="text-blue-600 font-medium">
                  Nhanh hơn {stats.timeSavedPct.toFixed(0)}%
                </span>
              ) : (
                <span>Thời gian tương đương</span>
              )}

              {stats.samePathLength && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Tối ưu tuyệt đối
                  </span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => <span className="text-right block pr-2">Thao tác</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInspectItem(row.original)}
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Xem chi tiết thực nghiệm"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original.id)}
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa lượt chạy"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto w-full">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-6 rounded-full bg-linear-to-b from-violet-500 to-purple-600" />
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <History className="w-6 h-6 text-purple-600" />
              Lịch Sử Thực Thi
            </h2>
            <Badge
              variant="outline"
              className="ml-2 border-purple-200 text-purple-700 bg-purple-50 font-bold"
            >
              {historyList.length} lượt chạy
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-3.5">
            Quản lý, phân tích đối đầu và xuất báo cáo dữ liệu thuật toán tìm đường
          </p>
        </div>

        {/* Action buttons right */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={historyList.length === 0}
            className="border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-xs"
            title="Xuất kết quả ra file CSV để làm báo cáo đồ án"
          >
            <Download className="w-4 h-4 mr-1.5 text-emerald-600" />
            Xuất CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={historyLoading}
            className="border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-xs"
          >
            <RotateCcw
              className={`w-4 h-4 mr-1.5 ${historyLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          {onClearAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              disabled={historyList.length === 0}
              className="border-red-200 text-red-600 hover:bg-red-50 font-bold shadow-xs"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Xóa tất cả
            </Button>
          )}
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Search input */}
            <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo ID (#47), môi trường, heuristic..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 placeholder:text-slate-400 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Middle & Right: Segment buttons and Heuristic selector */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Segment filter: Environment */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => {
                    setEnvFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    envFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tất cả ({historyList.length})
                </button>
                <button
                  onClick={() => {
                    setEnvFilter("grid");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                    envFilter === "grid"
                      ? "bg-white text-purple-700 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Grid ({gridCount})
                </button>
                <button
                  onClick={() => {
                    setEnvFilter("osm");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                    envFilter === "osm"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  OSM ({osmCount})
                </button>
              </div>

              {/* Heuristic Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={heuristicFilter}
                  onChange={(e) => {
                    setHeuristicFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="all">Tất cả Heuristic</option>
                  <option value="manhattan">Manhattan</option>
                  <option value="euclidean">Euclidean</option>
                </select>
              </div>

              {/* Reset filter button if active */}
              {(searchTerm || envFilter !== "all" || heuristicFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setEnvFilter("all");
                    setHeuristicFilter("all");
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Đặt lại
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table Card ──────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={currentData}
            getRowId={(row) => String(row.id)}
            enableSorting={false}
            emptyMessage={
              <div className="py-14 text-center">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">
                  {historyList.length === 0
                    ? "Chưa có lượt chạy nào được ghi lại"
                    : "Không tìm thấy kết quả phù hợp với bộ lọc"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {historyList.length === 0
                    ? "Chạy thực nghiệm ở tab So Sánh để lưu lại lịch sử tìm đường"
                    : "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* ── Pagination & Summary ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <p className="text-xs text-slate-500 font-medium">
          Đang hiển thị{" "}
          <span className="font-bold text-slate-700">
            {filteredData.length === 0
              ? 0
              : (validPage - 1) * itemsPerPage + 1}{" "}
            - {Math.min(validPage * itemsPerPage, filteredData.length)}
          </span>{" "}
          trong tổng số{" "}
          <span className="font-bold text-slate-700">{filteredData.length}</span>{" "}
          lượt chạy phù hợp
          {filteredData.length !== historyList.length && (
            <span className="text-slate-400">
              {" "}
              (lọc từ {historyList.length} lượt)
            </span>
          )}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage === 1}
              className="h-8 w-8 p-0 border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-colors
                    ${
                      validPage === i + 1
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage === totalPages}
              className="h-8 w-8 p-0 border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Modal Xem Chi Tiết Thực Nghiệm (Inspect Modal) ──────────────────── */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setInspectItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                  #{inspectItem.id}
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Chi Tiết Thực Nghiệm Tìm Đường
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(inspectItem.created_at).toLocaleString("vi-VN")} (
                    {formatTimeAgo(inspectItem.created_at)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const stats = getComparisonStats(inspectItem);
              const isOsm = inspectItem.map_type === "osm";

              return (
                <div className="space-y-4">
                  {/* Banner chiến thắng */}
                  {stats.hasBoth && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                        stats.winner === "astar"
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                          : stats.winner === "tie"
                            ? "bg-blue-50/80 border-blue-200 text-blue-900"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white shadow-xs">
                        <Trophy
                          className={`w-5 h-5 ${
                            stats.winner === "astar"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }`}
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-sm">
                          {stats.winner === "astar"
                            ? "A* Tối Ưu Vượt Trội"
                            : stats.winner === "tie"
                              ? "Hiệu Năng Hai Thuật Toán Tương Đương"
                              : "Dijkstra Tìm Đường Nhanh Hơn"}
                        </div>
                        <div className="opacity-90 mt-0.5">
                          {stats.nodesSavedPct > 0 &&
                            `Tiết kiệm được ${stats.nodesSavedPct.toFixed(1)}% số node đã duyệt (${stats.nodesSaved.toLocaleString()} nodes). `}
                          {stats.timeSpeedup > 1 &&
                            `Tốc độ thực thi nhanh hơn ${stats.timeSpeedup.toFixed(1)}×.`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hai thẻ song song Dijkstra vs A* */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Dijkstra Box */}
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Dijkstra
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white border-blue-200 text-blue-700"
                        >
                          Duyệt đều
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời gian:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatMs(stats.dijk?.execution_time || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nodes duyệt:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {(stats.dijk?.nodes_visited || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            {isOsm ? "Quãng đường:" : "Độ dài đường đi:"}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {stats.dijkSteps} {isOsm ? "km" : "bước"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* A* Box */}
                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-cyan-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          A* Algorithm
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white border-cyan-200 text-cyan-700 capitalize"
                        >
                          {stats.astar?.heuristic || "Heuristic"}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời gian:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatMs(stats.astar?.execution_time || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nodes duyệt:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {(stats.astar?.nodes_visited || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            {isOsm ? "Quãng đường:" : "Độ dài đường đi:"}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {stats.astarSteps} {isOsm ? "km" : "bước"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông số môi trường thực nghiệm */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-700 mb-1">
                      Cấu hình Môi trường
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        Loại đồ thị:{" "}
                        <span className="font-semibold text-slate-800">
                          {isOsm ? "OpenStreetMap (Real Map)" : "Lưới 2D (Grid)"}
                        </span>
                      </div>
                      <div>
                        Kích thước:{" "}
                        <span className="font-semibold text-slate-800">
                          {isOsm
                            ? "Tọa độ GPS thực tế"
                            : `${inspectItem.grid_size}×${inspectItem.grid_size}`}
                        </span>
                      </div>
                      {isOsm && inspectItem.start_lat && (
                        <>
                          <div>
                            Điểm xuất phát:{" "}
                            <span className="font-mono font-medium text-slate-700">
                              {inspectItem.start_lat?.toFixed(5)},{" "}
                              {inspectItem.start_lon?.toFixed(5)}
                            </span>
                          </div>
                          <div>
                            Điểm đích:{" "}
                            <span className="font-mono font-medium text-slate-700">
                              {inspectItem.end_lat?.toFixed(5)},{" "}
                              {inspectItem.end_lon?.toFixed(5)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectItem(null)}
                className="text-xs font-semibold"
              >
                Đóng
              </Button>
              {onNavigateCompare && (
                <Button
                  size="sm"
                  onClick={() => {
                    setInspectItem(null);
                    onNavigateCompare();
                  }}
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Mở trên tab So Sánh
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Xác Nhận Xóa Tất Cả (Clear All Confirmation) ─────────────── */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Xác Nhận Xóa Toàn Bộ Lịch Sử?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ{" "}
              <strong className="text-red-600">{historyList.length}</strong> lượt
              chạy thử nghiệm trong cơ sở dữ liệu? Tất cả dữ liệu đo lường thời gian
              và số node sẽ bị mất.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAll?.();
                }}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Xác nhận xóa tất cả
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
