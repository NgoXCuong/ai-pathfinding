"use client";

import React, { useState, useEffect, useCallback } from "react";
import { checkBackend, getGraphStats, getHistory, deleteHistory, clearAllHistory } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

import Sidebar, { type TabId } from "./components/Sidebar";
import OverviewTab from "./components/OverviewTab";
import CompareTab from "./components/CompareTab";
import BenchmarkTab from "./components/BenchmarkTab";
import HistoryTab from "./components/HistoryTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [osmStats, setOsmStats] = useState<{ loaded: boolean; nodes?: number; edges?: number }>({ loaded: false });

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHealthStatus = useCallback(async () => {
    try {
      const res = await checkBackend();
      setBackendConnected(res.status === "ok");
    } catch {
      setBackendConnected(false);
    }
    try {
      const stats = await getGraphStats();
      setOsmStats(stats);
    } catch {
      setOsmStats({ loaded: false });
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getHistory(100, 0);
      setHistoryList(data.histories || []);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: hợp lệ, setState xảy ra trong callback bất đồng bộ
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealthStatus();
    fetchHistory();
  }, [fetchHealthStatus, fetchHistory]);

  const handleDeleteHistory = async (id: number) => {
    try {
      await deleteHistory(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await clearAllHistory();
      setHistoryList([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
        osmStats={osmStats}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
        {activeTab === "overview" && (
          <OverviewTab
            backendConnected={backendConnected}
            osmStats={osmStats}
            historyList={historyList}
            setActiveTab={setActiveTab}
            onRefresh={fetchHistory}
          />
        )}

        {activeTab === "compare" && (
          <CompareTab
            onHistoryUpdate={fetchHistory}
            osmStats={osmStats}
            setOsmStats={setOsmStats}
          />
        )}

        {activeTab === "benchmark" && <BenchmarkTab />}

        {activeTab === "history" && (
          <HistoryTab
            historyList={historyList}
            historyLoading={historyLoading}
            onRefresh={fetchHistory}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
            onNavigateCompare={() => setActiveTab("compare")}
          />
        )}
      </main>
    </div>
  );
}
