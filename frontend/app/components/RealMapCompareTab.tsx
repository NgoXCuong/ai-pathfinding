"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Heuristic, RealCompareResult } from "@/lib/types";
import { loadOSMGraph, compareRealRoutes } from "@/lib/api";

import ControlPanel from "./RealMapCompare/ControlPanel";
import Visualization from "./RealMapCompare/Visualization";
import SummaryCard from "./RealMapCompare/SummaryCard";
import DetailModal from "./RealMapCompare/DetailModal";

interface RealMapCompareTabProps {
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  setOsmStats: (stats: { loaded: boolean; nodes?: number; edges?: number }) => void;
}

export default function RealMapCompareTab({ osmStats, setOsmStats }: RealMapCompareTabProps) {
  const [realCity, setRealCity] = useState("hanoi");
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingGraphProgress, setLoadingGraphProgress] = useState(0);
  const [realStart, setRealStart] = useState<{ lat: number; lon: number } | null>(null);
  const [realGoal, setRealGoal] = useState<{ lat: number; lon: number } | null>(null);
  const [heuristic, setHeuristic] = useState<Heuristic>("euclidean");
  const [result, setResult] = useState<RealCompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  // Mặc định: collapsed trên mobile, tự mở trên desktop (lg >= 1024px)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) setIsSummaryCollapsed(false);
    const handleChange = (e: MediaQueryListEvent) => setIsSummaryCollapsed(!e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Animation State
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50); // 1 to 100

  const handleLoadGraph = async () => {
    if (!realCity.trim()) {
      alert("Vui lòng nhập khu vực muốn tải (VD: Hanoi, Vietnam)!");
      return;
    }
    setLoadingGraph(true);
    setLoadingGraphProgress(5);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setLoadingGraphProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 500);

    try {
      const res = await loadOSMGraph(realCity);
      const nodes = res.total_nodes || res.nodes;
      const edges = res.total_edges || res.edges;
      setLoadingGraphProgress(100);

      // Delay slightly so user can see 100%
      setTimeout(() => {
        setOsmStats({ loaded: true, nodes, edges });
      }, 500);
} catch (e: unknown) {
      alert("Không thể tải OSM Graph: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoadingGraph(false), 500);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    if (isPlaying) return;
    if (!realStart) {
      setRealStart({ lat, lon });
    } else if (!realGoal) {
      setRealGoal({ lat, lon });
    } else {
      setRealStart({ lat, lon });
      setRealGoal(null);
      setResult(null);
      setIsPlaying(false);
      setAnimationProgress(0);
    }
  };

  const handleCompare = async () => {
    if (!realStart || !realGoal) {
      alert("Vui lòng chọn cả điểm Bắt đầu và điểm Đích trên bản đồ!");
      return;
    }
    if (!osmStats.loaded) {
      alert("Vui lòng tải đồ thị OSM trước!");
      return;
    }

    setLoading(true);
    try {
      const data = await compareRealRoutes({
        city: realCity,
        startLat: realStart.lat,
        startLon: realStart.lon,
        endLat: realGoal.lat,
        endLon: realGoal.lon,
        heuristic,
      });
      setResult(data);
      setAnimationProgress(0);
      setIsPlaying(true);
    } catch (e: unknown) {
      alert("Lỗi tìm đường bản đồ thực: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRealStart(null);
    setRealGoal(null);
    setResult(null);
    setIsPlaying(false);
    setAnimationProgress(0);
  };

  const getBatchSize = useCallback((maxNodes: number) => {
    const baseBatch = Math.max(1, Math.ceil(maxNodes / 300));
    const speedMultiplier = animationSpeed === 100 ? 50 : Math.max(1, animationSpeed / 10);
    return Math.floor(baseBatch * speedMultiplier);
  }, [animationSpeed]);

  const stepForward = () => {
    if (!result) return;
    setIsPlaying(false);
    const dijkstraMax = result.dijkstra.visited_coords?.length || 0;
    const astarMax = result.astar.visited_coords?.length || 0;
    const maxNodes = Math.max(dijkstraMax, astarMax);

    setAnimationProgress((prev) => Math.min(maxNodes, prev + getBatchSize(maxNodes)));
  };

  const stepBackward = () => {
    if (!result) return;
    setIsPlaying(false);
    const dijkstraMax = result.dijkstra.visited_coords?.length || 0;
    const astarMax = result.astar.visited_coords?.length || 0;
    const maxNodes = Math.max(dijkstraMax, astarMax);

    setAnimationProgress((prev) => Math.max(0, prev - getBatchSize(maxNodes)));
  };

  // Animation Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && result) {
      interval = setInterval(() => {
        setAnimationProgress((prev) => {
          const dijkstraMax = result.dijkstra.visited_coords?.length || 0;
          const astarMax = result.astar.visited_coords?.length || 0;
          const maxNodes = Math.max(dijkstraMax, astarMax);

          if (prev >= maxNodes) {
            setIsPlaying(false);
            return maxNodes;
          }

          return Math.min(maxNodes, prev + getBatchSize(maxNodes));
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isPlaying, result, getBatchSize]);

  const dijkstraMaxNodes = result?.dijkstra?.visited_coords?.length || 0;
  const astarMaxNodes = result?.astar?.visited_coords?.length || 0;
  const totalAnimationNodes = Math.max(dijkstraMaxNodes, astarMaxNodes);
  const isAnimationComplete = result && animationProgress >= totalAnimationNodes;

  return (
    <div className="space-y-6">
      <ControlPanel
        realCity={realCity}
        setRealCity={setRealCity}
        loadingGraph={loadingGraph}
        loadingGraphProgress={loadingGraphProgress}
        osmStats={osmStats}
        handleLoadGraph={handleLoadGraph}
        realStart={realStart}
        realGoal={realGoal}
        heuristic={heuristic}
        setHeuristic={setHeuristic}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        handleReset={handleReset}
        handleCompare={handleCompare}
        loading={loading}
        result={result}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        stepBackward={stepBackward}
        stepForward={stepForward}
        animationProgress={animationProgress}
        setAnimationProgress={setAnimationProgress}
        totalAnimationNodes={totalAnimationNodes}
      />

      <div className="relative">
        <Visualization
          realStart={realStart}
          realGoal={realGoal}
          handleMapClick={handleMapClick}
          isAnimationComplete={!!isAnimationComplete}
          result={result}
          animationProgress={animationProgress}
          heuristic={heuristic}
        />

        <SummaryCard
          result={result}
          isAnimationComplete={!!isAnimationComplete}
          isSummaryCollapsed={isSummaryCollapsed}
          setIsSummaryCollapsed={setIsSummaryCollapsed}
          setShowDetailModal={setShowDetailModal}
        />
      </div>

      <DetailModal
        showDetailModal={showDetailModal}
        setShowDetailModal={setShowDetailModal}
        result={result}
      />
    </div>
  );
}
