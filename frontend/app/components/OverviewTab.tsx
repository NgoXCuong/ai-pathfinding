"use client";

import React from "react";
import type { TabId } from "./Sidebar";
import type { HistoryItem } from "@/lib/types";

import DashboardHeader from "./Overview/DashboardHeader";
import KPICards from "./Overview/KPICards";
import HeroExperiment from "./Overview/HeroExperiment";
import PerformanceCharts from "./Overview/PerformanceCharts";
import AlgorithmInsight from "./Overview/AlgorithmInsight";
import ComparisonTable from "./Overview/ComparisonTable";
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
  const latestRun = historyList.length > 0 ? historyList[0] : undefined;

  return (
    <div className="max-w-8xl mx-auto w-full pb-12">
      {/* ── Header ───────────────────────────────────── */}
      <DashboardHeader
        backendConnected={backendConnected}
        osmStats={osmStats}
        setActiveTab={setActiveTab}
        onRefresh={onRefresh}
      />

      {/* ── KPI Strip ────────────────────────────────── */}
      <KPICards historyList={historyList} />

      {/* ── Hero Experiment ──────────────────────────── */}
      <HeroExperiment latestRun={latestRun} setActiveTab={setActiveTab} />

      {/* ── Charts + Insight (side by side) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2">
          <PerformanceCharts historyList={historyList} />
        </div>
        <div className="lg:col-span-1">
          <AlgorithmInsight historyList={historyList} />
        </div>
      </div>

      {/* ── Comparison Table + Timeline (side by side) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="flex flex-col">
          <ComparisonTable latestRun={latestRun} />
        </div>
        <div className="flex flex-col">
          <ExperimentTimeline historyList={historyList} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
