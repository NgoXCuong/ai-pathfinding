"use client";

import React, { useState, useMemo } from "react";
import type { TabId } from "./Sidebar";
import type { HistoryItem } from "@/lib/types";

import DashboardHeader, { type MapFilterType } from "./Overview/DashboardHeader";
import KPICards from "./Overview/KPICards";
import HeroExperiment from "./Overview/HeroExperiment";
import PerformanceCharts from "./Overview/PerformanceCharts";
import AlgorithmInsight from "./Overview/AlgorithmInsight";
import ScalabilityBenchmark from "./Overview/ScalabilityBenchmark";
import ExperimentTimeline from "./Overview/ExperimentTimeline";

interface OverviewTabProps {
  backendConnected: boolean | null;
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  historyList: HistoryItem[];
  setActiveTab: (tab: TabId) => void;
  onRefresh?: () => void;
}

export default function OverviewTab({
  backendConnected,
  osmStats,
  historyList,
  setActiveTab,
  onRefresh,
}: OverviewTabProps) {
  const [mapFilter, setMapFilter] = useState<MapFilterType>("all");

  const gridRunsCount = useMemo(
    () => historyList.filter((h) => h.map_type === "grid").length,
    [historyList]
  );
  const osmRunsCount = useMemo(
    () => historyList.filter((h) => h.map_type === "osm").length,
    [historyList]
  );

  const filteredHistoryList = useMemo(() => {
    if (mapFilter === "grid") return historyList.filter((h) => h.map_type === "grid");
    if (mapFilter === "osm") return historyList.filter((h) => h.map_type === "osm");
    return historyList;
  }, [historyList, mapFilter]);

  const latestRun = filteredHistoryList.length > 0 ? filteredHistoryList[0] : undefined;

  return (
    <div className="max-w-8xl mx-auto w-full pb-12">
      {/* ── Header ───────────────────────────────────── */}
      <DashboardHeader
        backendConnected={backendConnected}
        osmStats={osmStats}
        setActiveTab={setActiveTab}
        onRefresh={onRefresh}
        mapFilter={mapFilter}
        setMapFilter={setMapFilter}
        totalRuns={historyList.length}
        gridRunsCount={gridRunsCount}
        osmRunsCount={osmRunsCount}
      />

      {/* ── KPI Strip ────────────────────────────────── */}
      <KPICards historyList={filteredHistoryList} />

      {/* ── Hero Experiment ──────────────────────────── */}
      <HeroExperiment latestRun={latestRun} setActiveTab={setActiveTab} />

      {/* ── Charts + Insight (side by side) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <PerformanceCharts historyList={filteredHistoryList} />
        </div>
        <div className="lg:col-span-1">
          <AlgorithmInsight historyList={filteredHistoryList} />
        </div>
      </div>

      {/* ── Scalability Benchmark + Timeline (side by side) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="flex flex-col">
          <ScalabilityBenchmark historyList={filteredHistoryList} />
        </div>
        <div className="flex flex-col">
          <ExperimentTimeline historyList={filteredHistoryList} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
