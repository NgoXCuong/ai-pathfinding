"use client";

import React, { useState } from "react";
import { Grid, Map as MapIcon } from "lucide-react";
import GridCompareTab from "./GridCompareTab";
import RealMapCompareTab from "./RealMapCompareTab";

type SubTab = "demo" | "map";

interface CompareTabProps {
  onHistoryUpdate: () => void;
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  setOsmStats: (stats: { loaded: boolean; nodes?: number; edges?: number }) => void;
}

const SUB_TABS = [
  { id: "demo" as SubTab, label: "Grid Demo", icon: Grid },
  { id: "map" as SubTab, label: "Real Map", icon: MapIcon },
];

export default function CompareTab({ onHistoryUpdate, osmStats, setOsmStats }: CompareTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("demo");

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto w-full">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500" />
            <h2 className="text-xl font-black text-slate-900">So Sánh Dijkstra vs A*</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium pl-3">
            Trực quan hoá và đo lường hiệu năng hai thuật toán tìm đường
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {SUB_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subTab === id
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────── */}
      {subTab === "demo" && <GridCompareTab onHistoryUpdate={onHistoryUpdate} />}
      {subTab === "map" && (
        <RealMapCompareTab
          osmStats={osmStats}
          setOsmStats={setOsmStats}
          onHistoryUpdate={onHistoryUpdate}
        />
      )}
    </div>
  );
}
