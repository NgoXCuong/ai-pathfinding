import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TabId } from "../Sidebar";

interface DashboardHeaderProps {
  backendConnected: boolean | null;
  setActiveTab: (tab: TabId) => void;
  onRefresh?: () => void;
  osmStats?: { loaded: boolean; nodes?: number; edges?: number };
}

export default function DashboardHeader({
  backendConnected,
  setActiveTab,
  onRefresh,
  osmStats,
}: DashboardHeaderProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-6">
      {/* Top header bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
            <h2 className="text-2xl font-black text-slate-900  ">
              PathFinder Dashboard
            </h2>
          </div>
          <p className="text-sm text-slate-400 font-medium pl-3">
            {date} — Phân tích hiệu năng thuật toán tìm đường
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Live clock */}
          <div className="px-3 py-2 bg-slate-900 text-white rounded-lg font-mono text-sm font-bold     r shrink-0">
            {time}
          </div>

          {/* Backend status */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold shrink-0 ${backendConnected === true
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : backendConnected === false
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
          >
            {backendConnected === true ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>{backendConnected === true ? "Backend Online" : backendConnected === false ? "Offline" : "Đang kết nối..."}</span>
            {backendConnected === true && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          {/* OSM Status */}
          {osmStats && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-50 border-blue-200 text-sm font-bold text-blue-700 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${osmStats.loaded ? "bg-blue-500" : "bg-blue-300"}`} />
              OSM: {osmStats.loaded ? `${(osmStats.nodes || 0).toLocaleString()} nodes` : "Chưa tải"}
            </div>
          )}

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="h-9 border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Làm mới
            </Button>
          )}

          <Button
            onClick={() => setActiveTab("compare")}
            className="h-9 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Thực nghiệm mới
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-5 h-px bg-gradient-to-r from-cyan-200 via-blue-200 to-transparent" />
    </div>
  );
}
