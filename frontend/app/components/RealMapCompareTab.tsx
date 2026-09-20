"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Heuristic, RealCompareResult } from "@/lib/types";
import { loadOSMGraph, compareRealRoutes, saveHistory } from "@/lib/api";

import ControlPanel from "./RealMapCompare/ControlPanel";
import Visualization from "./RealMapCompare/Visualization";
import RealMapComparisonResults from "./RealMapCompare/RealMapComparisonResults";

interface RealMapCompareTabProps {
  osmStats: { loaded: boolean; nodes?: number; edges?: number };
  setOsmStats: (stats: { loaded: boolean; nodes?: number; edges?: number }) => void;
  onHistoryUpdate?: () => void;
}

export default function RealMapCompareTab({
  osmStats,
  setOsmStats,
  onHistoryUpdate,
}: RealMapCompareTabProps) {
  const [realCity, setRealCity] = useState("hanoi");
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingGraphProgress, setLoadingGraphProgress] = useState(0);
  const [realStart, setRealStart] = useState<{ lat: number; lon: number } | null>(null);
  const [realGoal, setRealGoal] = useState<{ lat: number; lon: number } | null>(null);
  const [heuristic, setHeuristic] = useState<Heuristic>("euclidean");
  const [result, setResult] = useState<RealCompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Independent animation state
  const [dijkstraVisited, setDijkstraVisited] = useState(0);
  const [astarVisited, setAstarVisited] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50); // 1 to 100

  // High-performance mutable animation ref
  const animRef = useRef({ dV: 0, aV: 0 });
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const dijkstraTotal = result?.dijkstra?.visited_coords?.length || 0;
  const astarTotal = result?.astar?.visited_coords?.length || 0;

  const handleLoadGraph = async () => {
    if (!realCity.trim()) {
      alert("Vui lòng chọn khu vực muốn tải!");
      return;
    }
    setLoadingGraph(true);
    setLoadingGraphProgress(5);

    const progressInterval = setInterval(() => {
      setLoadingGraphProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 400);

    try {
      const res = await loadOSMGraph(realCity);
      const nodes = res.total_nodes || res.nodes;
      const edges = res.total_edges || res.edges;
      setLoadingGraphProgress(100);

      setTimeout(() => {
        setOsmStats({ loaded: true, nodes, edges });
      }, 400);
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
      animRef.current = { dV: 0, aV: 0 };
      setDijkstraVisited(0);
      setAstarVisited(0);
    }
  };

  const handleCompare = async () => {
    if (!realStart || !realGoal) {
      alert("Vui lòng chọn cả điểm Bắt đầu và điểm Đích trên bản đồ!");
      return;
    }
    if (!osmStats.loaded) {
      alert("Vui lòng tải dữ liệu đồ thị OSM trước!");
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
      animRef.current = { dV: 0, aV: 0 };
      setDijkstraVisited(0);
      setAstarVisited(0);
      setIsPlaying(true);

      // Lưu kết quả tìm đường bản đồ thực vào lịch sử
      try {
        await saveHistory({
          mapType: "osm",
          startLat: realStart.lat,
          startLon: realStart.lon,
          endLat: realGoal.lat,
          endLon: realGoal.lon,
          results: [
            {
              algorithm: "dijkstra",
              execution_time: data.dijkstra.execution_time,
              nodes_visited: data.dijkstra.nodes_visited,
              distance: data.dijkstra.distance,
              steps: data.dijkstra.steps,
              found: data.dijkstra.found,
            },
            {
              algorithm: "astar",
              heuristic: heuristic,
              execution_time: data.astar.execution_time,
              nodes_visited: data.astar.nodes_visited,
              distance: data.astar.distance,
              steps: data.astar.steps,
              found: data.astar.found,
            },
          ],
        });
        onHistoryUpdate?.();
      } catch (err) {
        console.warn("Không thể lưu lịch sử OSM:", err);
      }

      // Auto-scroll gently to the map area
      setTimeout(() => {
        mapAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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
    animRef.current = { dV: 0, aV: 0 };
    setDijkstraVisited(0);
    setAstarVisited(0);
  };

  const handleSwapPoints = () => {
    if (!realStart || !realGoal) return;
    const temp = realStart;
    setRealStart(realGoal);
    setRealGoal(temp);
    setResult(null);
    setIsPlaying(false);
    animRef.current = { dV: 0, aV: 0 };
    setDijkstraVisited(0);
    setAstarVisited(0);
  };

  const getStepBatch = useCallback(
    (total: number) => {
      const base = Math.max(1, Math.ceil(total / 150));
      const multiplier = animationSpeed === 100 ? 5 : Math.max(0.2, animationSpeed / 50);
      return Math.max(1, Math.floor(base * multiplier));
    },
    [animationSpeed]
  );

  const skipToEnd = () => {
    if (!result) return;
    setIsPlaying(false);
    animRef.current = { dV: dijkstraTotal, aV: astarTotal };
    setDijkstraVisited(dijkstraTotal);
    setAstarVisited(astarTotal);
  };

  const stepForward = () => {
    if (!result) return;
    setIsPlaying(false);
    const s = animRef.current;
    const dBatch = getStepBatch(dijkstraTotal);
    const aBatch = getStepBatch(astarTotal);

    if (s.dV < dijkstraTotal) s.dV = Math.min(dijkstraTotal, s.dV + dBatch);
    if (s.aV < astarTotal) s.aV = Math.min(astarTotal, s.aV + aBatch);

    setDijkstraVisited(s.dV);
    setAstarVisited(s.aV);
  };

  const stepBackward = () => {
    if (!result) return;
    setIsPlaying(false);
    const s = animRef.current;
    const dBatch = getStepBatch(dijkstraTotal);
    const aBatch = getStepBatch(astarTotal);

    if (s.dV > 0) s.dV = Math.max(0, s.dV - dBatch);
    if (s.aV > 0) s.aV = Math.max(0, s.aV - aBatch);

    setDijkstraVisited(s.dV);
    setAstarVisited(s.aV);
  };

  // ── INDEPENDENT ANIMATION LOOP ───────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && result) {
      interval = setInterval(() => {
        const s = animRef.current;
        const dBatch = getStepBatch(dijkstraTotal);
        const aBatch = getStepBatch(astarTotal);

        let updated = false;

        // 1. DIJKSTRA PROGRESS
        if (s.dV < dijkstraTotal) {
          s.dV = Math.min(dijkstraTotal, s.dV + dBatch);
          updated = true;
        }

        // 2. A* PROGRESS (Độc lập: khi chạm đích trước, NGAY LẬP TỨC hoàn thành và vẽ đường đi)
        if (s.aV < astarTotal) {
          s.aV = Math.min(astarTotal, s.aV + aBatch);
          updated = true;
        }

        if (updated) {
          setDijkstraVisited(s.dV);
          setAstarVisited(s.aV);
        }

        // Cả 2 đã duyệt xong hết
        if (s.dV >= dijkstraTotal && s.aV >= astarTotal) {
          setIsPlaying(false);
        }
      }, 25);
    }
    return () => clearInterval(interval);
  }, [isPlaying, result, dijkstraTotal, astarTotal, getStepBatch]);

  // Overall progress percentage
  const totalNodesToAnimate = dijkstraTotal + astarTotal;
  const currentAnimatedNodes = dijkstraVisited + astarVisited;
  const progressPercent =
    totalNodesToAnimate > 0
      ? (currentAnimatedNodes / totalNodesToAnimate) * 100
      : 0;

  // A* draws its path immediately when its own visited count reaches its total
  const isDijkstraPathVisible = dijkstraTotal > 0 && dijkstraVisited >= dijkstraTotal;
  const isAstarPathVisible = astarTotal > 0 && astarVisited >= astarTotal;

  return (
    <div className="space-y-4">
      <ControlPanel
        realCity={realCity}
        setRealCity={setRealCity}
        loadingGraph={loadingGraph}
        loadingGraphProgress={loadingGraphProgress}
        osmStats={osmStats}
        handleLoadGraph={handleLoadGraph}
        realStart={realStart}
        realGoal={realGoal}
        handleSwapPoints={handleSwapPoints}
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
        skipToEnd={skipToEnd}
        progressPercent={progressPercent}
      />

      {/* 2 Bản đồ phóng to, trực quan, độc lập và không bị che khuất */}
      <div ref={mapAreaRef}>
        <Visualization
          realStart={realStart}
          realGoal={realGoal}
          handleMapClick={handleMapClick}
          result={result}
          heuristic={heuristic}
          dijkstraVisitedCount={dijkstraVisited}
          isDijkstraPathVisible={isDijkstraPathVisible}
          astarVisitedCount={astarVisited}
          isAstarPathVisible={isAstarPathVisible}
        />
      </div>

      {/* Bảng đối đầu thông số kỹ thuật đầy đủ đặt ngay bên dưới bản đồ */}
      <div ref={resultsRef}>
        <RealMapComparisonResults result={result} />
      </div>
    </div>
  );
}
