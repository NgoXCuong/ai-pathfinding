"use client";

import React, { useState } from "react";
import { History, RotateCcw, Trash2, Clock, Grid3X3, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMs, formatTimeAgo } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HistoryTabProps {
  historyList: HistoryItem[];
  historyLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
}



export default function HistoryTab({ historyList, historyLoading, onRefresh, onDelete }: HistoryTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(historyList.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  
  const currentData = historyList.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-purple-500" />
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-purple-500" />
              Lịch Sử Thực Thi
            </h2>
          </div>
          <p className="text-[13px] text-slate-500 font-normal pl-3 mt-0.5">
            Các lượt chạy tìm đường được lưu tự động trong cơ sở dữ liệu
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={historyLoading}
          className="border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
        >
          <RotateCcw className={`w-4 h-4 mr-1.5 ${historyLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* ── Table Card ─────────────────────────── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-sm font-semibold uppercase text-slate-500">ID</th>
                <th className="px-5 py-3.5 text-sm font-semibold uppercase text-slate-500">Môi trường</th>
                <th className="px-5 py-3.5 text-sm font-semibold uppercase text-slate-500">Thời điểm</th>
                <th className="px-5 py-3.5 text-sm font-semibold uppercase text-slate-500">Kết quả</th>
                <th className="px-5 py-3.5 text-sm font-semibold uppercase text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((item) => {
                const isOsm = item.map_type === "osm";
                const astar = item.results.find((r) => r.algorithm === "astar");
                const dijk = item.results.find((r) => r.algorithm === "dijkstra");

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* ID */}
                    <td className="px-5 py-4 font-mono text-slate-400 text-sm">#{item.id}</td>

                    {/* Env */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isOsm ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                          {isOsm ? <Map className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-700">
                            {isOsm ? "OSM Real Map" : `Grid ${item.grid_size}×${item.grid_size}`}
                          </div>
                          {astar?.heuristic && (
                            <div className="text-sm text-slate-500 font-medium capitalize">{astar.heuristic}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(item.created_at)}</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </div>
                    </td>

                    {/* Results */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {dijk && (
                          <div className="flex items-center gap-2 text-[13px]">
                            <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 text-sm py-0 px-1.5 font-semibold">Dijkstra</Badge>
                            <span className="font-mono text-slate-600 font-medium">{formatMs(dijk.execution_time || 0)}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{(dijk.nodes_visited || 0).toLocaleString()} nodes</span>
                          </div>
                        )}
                        {astar && (
                          <div className="flex items-center gap-2 text-[13px]">
                            <Badge variant="outline" className="border-cyan-200 text-cyan-600 bg-cyan-50 text-sm py-0 px-1.5 font-semibold">A*</Badge>
                            <span className="font-mono text-slate-600 font-medium">{formatMs(astar.execution_time || 0)}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{(astar.nodes_visited || 0).toLocaleString()} nodes</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {historyList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Chưa có lịch sử nào được ghi lại</p>
                    <p className="text-sm text-slate-300 mt-1">Chạy thực nghiệm ở tab So Sánh để bắt đầu</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination & Footer */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">
          Hiển thị {(validPage - 1) * itemsPerPage + 1} - {Math.min(validPage * itemsPerPage, historyList.length)} trong tổng số {historyList.length} lượt chạy
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-md text-sm font-semibold flex items-center justify-center transition-colors
                    ${validPage === i + 1 
                      ? "bg-slate-900 text-white" 
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
