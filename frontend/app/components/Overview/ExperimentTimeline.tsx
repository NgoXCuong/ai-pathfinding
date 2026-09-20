"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/lib/types";
import { formatMs, formatNumber, formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TabId } from "../Sidebar";
import { ArrowRight, Clock, Grid3X3, Map, Zap, RotateCcw } from "lucide-react";

interface ExperimentTimelineProps {
  historyList: HistoryItem[];
  setActiveTab: (tab: TabId) => void;
}

export default function ExperimentTimeline({ historyList, setActiveTab }: ExperimentTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(historyList.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);

  if (historyList.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm h-full flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100">
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Lịch sử thực nghiệm</h3>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-14 text-center text-slate-400 flex-1">
            <Clock className="w-9 h-9 mb-3" />
            <p className="text-sm font-semibold">Chưa có lịch sử thực nghiệm</p>
            <p className="text-[13px] text-slate-300 mt-1">Các lần chạy sẽ xuất hiện tại đây</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const recent = historyList.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Lịch sử thực nghiệm</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("history")}
            className="text-sm h-8 text-slate-500 hover:text-slate-800 font-bold"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="p-4 space-y-3 flex-1">
          {recent.map((run, i) => {
            const astar = run.results?.find((r) => r.algorithm === "astar") || run.results?.[0];
            const dijk = run.results?.find((r) => r.algorithm === "dijkstra") || run.results?.[1];
            const isOsm = run.map_type === "osm";
            const envName = isOsm ? "OSM Map" : `Grid ${run.grid_size}×${run.grid_size}`;
            const astarTime = astar?.execution_time || 0;
            const dijkTime = dijk?.execution_time || 0;

            let winnerText = null;
            let winnerColor = "";
            if (astar?.found === false || dijk?.found === false) {
              winnerText = "Không có đường đi";
              winnerColor = "text-red-500";
            } else if (dijkTime > 0 && astarTime > 0) {
              if (astarTime < dijkTime) {
                winnerText = `A* nhanh hơn ${((dijkTime - astarTime) / dijkTime * 100).toFixed(0)}%`;
                winnerColor = "text-emerald-600";
              } else if (dijkTime < astarTime) {
                winnerText = `Dijkstra nhanh hơn ${((astarTime - dijkTime) / astarTime * 100).toFixed(0)}%`;
                winnerColor = "text-blue-600";
              }
            }

            return (
              <div
                key={run.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-200"
                onClick={() => setActiveTab("history")}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${isOsm ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {isOsm ? <Map className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </div>
                  {i < recent.length - 1 && (
                    <div className="w-px h-2 bg-slate-200 mt-1" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-sm text-cyan-600">A*</span>
                    <span className="text-slate-300 text-sm">/</span>
                    <span className="text-sm font-semibold text-slate-600 truncate">{envName}</span>
                    {astar?.heuristic && (
                      <span className="text-[13px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold ml-1 truncate">
                        {astar.heuristic}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="font-mono font-semibold">{formatMs(astarTime)}</span>
                    <span>•</span>
                    <span>{formatNumber(astar?.nodes_visited || 0)} nodes</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="shrink-0 flex items-center gap-2">
                  <div className="text-right">
                    {winnerText && (
                      <div className={`text-[12px] font-bold ${winnerColor} flex items-center gap-0.5 justify-end mb-0.5`}>
                        <Zap className="w-3 h-3" />
                        {winnerText}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 font-medium">
                      {formatTimeAgo(run.created_at)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("compare");
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Mở tab So sánh"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[13px] text-slate-500 font-medium">
              Trang {validPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={validPage === 1}
                className="h-7 px-2 text-xs"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={validPage === totalPages}
                className="h-7 px-2 text-xs"
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
