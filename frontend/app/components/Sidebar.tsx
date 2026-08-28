"use client";

import React from "react";
import {
  Activity,
  GitCompareArrows,
  BarChart3,
  History,
  Zap,
  Server,
  Globe,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type TabId = "overview" | "compare" | "benchmark" | "history";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  backendConnected: boolean | null;
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode; sub?: string }[] = [
  { id: "overview", label: "Dashboard", icon: <Activity className="w-4 h-4" />, sub: "Tổng quan" },
  { id: "compare", label: "So Sánh", icon: <GitCompareArrows className="w-4 h-4" />, sub: "Dijkstra vs A*" },
  { id: "benchmark", label: "Thực nghiệm", icon: <BarChart3 className="w-4 h-4" />, sub: "Đánh giá hiệu năng" },
  { id: "history", label: "Lịch Sử", icon: <History className="w-4 h-4" />, sub: "Các lượt chạy" },
];

export default function Sidebar({ activeTab, setActiveTab, backendConnected, osmStats }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-4 z-20 shrink-0">
      <div>
        {/* ── Logo ─────────────────────────────────── */}
        <div className="flex items-center gap-3 px-2 py-4 mb-5 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-xl leading-none text-slate-800 mb-1">PathFinder Lab</h1>
            <span className="text-[13px] text-blue-500 font-medium italic leading-tight">
              Algorithm Visualization & Analysis
            </span>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────── */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group ${isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
              >
                <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {item.icon}
                </span>
                <div className="text-left min-w-0">
                  <div className={`text-sm font-bold leading-none mb-1.5 ${isActive ? "text-white" : "text-slate-700"}`}>{item.label}</div>
                  {item.sub && (
                    <div className={`text-[13px] font-medium leading-none ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                      {item.sub}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Status Footer ────────────────────────── */}
      <div className="space-y-1.5 pt-4 border-t border-slate-100 pb-2">
        <h4 className="text-[13px] font-bold uppercase text-slate-400 mb-2 px-2">System Status</h4>

        {/* Backend */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm text-slate-500 font-medium">Backend</span>
          {backendConnected === true && (
            <span className="text-[13px] font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
            </span>
          )}
          {backendConnected === false && (
            <span className="text-[13px] font-bold text-red-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
            </span>
          )}
          {backendConnected === null && (
            <span className="text-[13px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> ...
            </span>
          )}
        </div>

        {/* OSM Graph */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm text-slate-500 font-medium">OSM Map</span>
          {osmStats.loaded ? (
            <span className="text-[13px] font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
            </span>
          ) : (
            <span className="text-[13px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Unloaded
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
