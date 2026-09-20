"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Heuristic, DrawMode, ComparisonResult, AlgorithmResult } from "@/lib/types";
import { generateGrid, compareAlgorithms, saveHistory } from "@/lib/api";
import GridControlPanel from "./GridControlPanel";
import AlgorithmGridCard from "./AlgorithmGridCard";
import ComparisonResults from "./ComparisonResults";

interface GridCompareTabProps {
  onHistoryUpdate: () => void;
}

export default function GridCompareTab({ onHistoryUpdate }: GridCompareTabProps) {
  // Config State
  const [gridSize, setGridSize] = useState(20);
  const [obstacleDensity, setObstacleDensity] = useState(0.25);
  const [allowDiagonal, setAllowDiagonal] = useState(false);
  const [heuristic, setHeuristic] = useState<Heuristic>("manhattan");

  // Grid Data State
  const [obstacles, setObstacles] = useState<number[][]>([]);
  const [startPos, setStartPos] = useState<[number, number]>([0, 0]);
  const [goalPos, setGoalPos] = useState<[number, number]>([19, 19]);

  // Interaction State
  const [drawMode, setDrawMode] = useState<DrawMode>("obstacle");
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Execution State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const initializedRef = useRef(false);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50);

  // Independent Progress States for Dijkstra and A*
  const [dijkstraVisited, setDijkstraVisited] = useState(0);
  const [dijkstraPath, setDijkstraPath] = useState(0);
  const [astarVisited, setAstarVisited] = useState(0);
  const [astarPath, setAstarPath] = useState(0);

  const animRef = useRef({ dV: 0, dP: 0, aV: 0, aP: 0 });
  const gridAreaRef = useRef<HTMLDivElement | null>(null);

  const dTotalVisited = results ? (results.dijkstra.visited_order?.length || 0) : 0;
  const dTotalPath = results ? (results.dijkstra.path?.length || 0) : 0;
  const aTotalVisited = results ? (results.astar.visited_order?.length || 0) : 0;
  const aTotalPath = results ? (results.astar.path?.length || 0) : 0;

  const resetAll = useCallback(() => {
    setResults(null);
    setIsPlaying(false);
    animRef.current = { dV: 0, dP: 0, aV: 0, aP: 0 };
    setDijkstraVisited(0);
    setDijkstraPath(0);
    setAstarVisited(0);
    setAstarPath(0);
  }, []);

  const handleGenerateGrid = useCallback(async (size = gridSize, density = obstacleDensity) => {
    try {
      const res = await generateGrid(size, density);
      setObstacles(res.obstacles);
      setStartPos([0, 0]);
      setGoalPos([size - 1, size - 1]);
      resetAll();
    } catch (err) {
      console.error("Generate grid error", err);
    }
  }, [gridSize, obstacleDensity, resetAll]);

  // INITIALIZATION — chạy đúng 1 lần khi mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      handleGenerateGrid(20, 0.25);
    }
  }, [handleGenerateGrid]);

  // GRID INTERACTION HANDLERS
  const isInteractingDisabled = isPlaying || dijkstraVisited > 0 || astarVisited > 0;

  const handleCellClick = useCallback((r: number, c: number) => {
    if (isInteractingDisabled) return; // Prevent edit during/after run
    if (drawMode === "start") {
      setStartPos([r, c]);
    } else if (drawMode === "goal") {
      setGoalPos([r, c]);
    } else if (drawMode === "obstacle") {
      if ((r === startPos[0] && c === startPos[1]) || (r === goalPos[0] && c === goalPos[1])) return;
      if (!obstacles.some(([obsR, obsC]) => obsR === r && obsC === c)) {
        setObstacles((prev) => [...prev, [r, c]]);
      }
    } else if (drawMode === "erase") {
      setObstacles((prev) => prev.filter(([obsR, obsC]) => !(obsR === r && obsC === c)));
    }
  }, [isInteractingDisabled, drawMode, startPos, goalPos, obstacles]);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (!isMouseDown || isInteractingDisabled) return;
    handleCellClick(r, c);
  }, [isMouseDown, isInteractingDisabled, handleCellClick]);

  // EXECUTION
  const runCompare = async () => {
    setLoading(true);
    resetAll();
    try {
      const data = await compareAlgorithms({
        size: gridSize,
        obstacles,
        start: startPos,
        goal: goalPos,
        heuristic,
        allowDiagonal,
      });
      setResults(data);
      animRef.current = { dV: 0, dP: 0, aV: 0, aP: 0 };
      await saveHistory({
        mapType: "grid",
        gridSize,
        results: [
          { ...data.dijkstra, algorithm: "dijkstra" },
          { ...data.astar, algorithm: "astar", heuristic },
        ],
      });
      onHistoryUpdate();
      setIsPlaying(true);
      setTimeout(() => {
        gridAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    } catch (err) {
      alert("Lỗi khi tìm đường: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // ANIMATION CONTROLS
  const stepForward = () => {
    if (!results) return;
    setIsPlaying(false);
    const s = animRef.current;
    if (s.dV < dTotalVisited) s.dV = Math.min(dTotalVisited, s.dV + 2);
    else if (s.dP < dTotalPath) s.dP = Math.min(dTotalPath, s.dP + 1);

    if (s.aV < aTotalVisited) s.aV = Math.min(aTotalVisited, s.aV + 2);
    else if (s.aP < aTotalPath) s.aP = Math.min(aTotalPath, s.aP + 1);

    setDijkstraVisited(s.dV);
    setDijkstraPath(s.dP);
    setAstarVisited(s.aV);
    setAstarPath(s.aP);
  };

  const stepBackward = () => {
    if (!results) return;
    setIsPlaying(false);
    const s = animRef.current;
    if (s.dP > 0) s.dP = Math.max(0, s.dP - 1);
    else if (s.dV > 0) s.dV = Math.max(0, s.dV - 2);

    if (s.aP > 0) s.aP = Math.max(0, s.aP - 1);
    else if (s.aV > 0) s.aV = Math.max(0, s.aV - 2);

    setDijkstraVisited(s.dV);
    setDijkstraPath(s.dP);
    setAstarVisited(s.aV);
    setAstarPath(s.aP);
  };

  const skipToEnd = () => {
    if (!results) return;
    setIsPlaying(false);
    animRef.current = { dV: dTotalVisited, dP: dTotalPath, aV: aTotalVisited, aP: aTotalPath };
    setDijkstraVisited(dTotalVisited);
    setDijkstraPath(dTotalPath);
    setAstarVisited(aTotalVisited);
    setAstarPath(aTotalPath);
  };

  // MAIN INDEPENDENT ANIMATION LOOP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && results) {
      interval = setInterval(() => {
        const s = animRef.current;
        const maxSteps = Math.max(dTotalVisited, aTotalVisited, 1);
        const baseBatch = Math.max(1, Math.ceil(maxSteps / 100));
        const speedMultiplier = animationSpeed === 100 ? 5 : Math.max(0.2, animationSpeed / 50);
        const batch = Math.max(1, Math.floor(baseBatch * speedMultiplier));
        const pathBatch = Math.max(1, Math.floor(Math.max(1, speedMultiplier)));

        let updated = false;

        // 1. DIJKSTRA PROGRESS
        if (s.dV < dTotalVisited) {
          s.dV = Math.min(dTotalVisited, s.dV + batch);
          updated = true;
        } else if (s.dP < dTotalPath) {
          // Dijkstra vẽ đường khi đã duyệt chạm đích
          s.dP = Math.min(dTotalPath, s.dP + pathBatch);
          updated = true;
        }

        // 2. A* PROGRESS (Độc lập: khi chạm đích trước, NGAY LẬP TỨC vẽ đường đi của A*)
        if (s.aV < aTotalVisited) {
          s.aV = Math.min(aTotalVisited, s.aV + batch);
          updated = true;
        } else if (s.aP < aTotalPath) {
          // A* duyệt xong trước sẽ vẽ đường đi luôn!
          s.aP = Math.min(aTotalPath, s.aP + pathBatch);
          updated = true;
        }

        if (updated) {
          setDijkstraVisited(s.dV);
          setDijkstraPath(s.dP);
          setAstarVisited(s.aV);
          setAstarPath(s.aP);
        }

        // Kiểm tra xem cả hai đã vẽ xong toàn bộ chưa
        const dFinished = s.dV >= dTotalVisited && s.dP >= dTotalPath;
        const aFinished = s.aV >= aTotalVisited && s.aP >= aTotalPath;
        if (dFinished && aFinished) {
          setIsPlaying(false);
        }
      }, 20);
    }
    return () => clearInterval(interval);
  }, [isPlaying, results, dTotalVisited, dTotalPath, aTotalVisited, aTotalPath, animationSpeed]);

  // DERIVED DATA FOR GRID RENDER (Tối ưu hóa với useMemo)
  const obstaclesSet = useMemo(() => new Set(obstacles.map(([r, c]) => `${r},${c}`)), [obstacles]);

  const dijkstraVisitedSet = useMemo(() => {
    const set = new Set<string>();
    if (!results) return set;
    const vList = results.dijkstra.visited_order || [];
    const limit = Math.min(dijkstraVisited, vList.length);
    for (let i = 0; i < limit; i++) {
      if (vList[i]) set.add(`${vList[i][0]},${vList[i][1]}`);
    }
    return set;
  }, [results, dijkstraVisited]);

  const dijkstraPathSet = useMemo(() => {
    const set = new Set<string>();
    if (!results) return set;
    const pList = results.dijkstra.path || [];
    const limit = Math.min(dijkstraPath, pList.length);
    for (let i = 0; i < limit; i++) {
      if (pList[i]) set.add(`${pList[i][0]},${pList[i][1]}`);
    }
    return set;
  }, [results, dijkstraPath]);

  const astarVisitedSet = useMemo(() => {
    const set = new Set<string>();
    if (!results) return set;
    const vList = results.astar.visited_order || [];
    const limit = Math.min(astarVisited, vList.length);
    for (let i = 0; i < limit; i++) {
      if (vList[i]) set.add(`${vList[i][0]},${vList[i][1]}`);
    }
    return set;
  }, [results, astarVisited]);

  const astarPathSet = useMemo(() => {
    const set = new Set<string>();
    if (!results) return set;
    const pList = results.astar.path || [];
    const limit = Math.min(astarPath, pList.length);
    for (let i = 0; i < limit; i++) {
      if (pList[i]) set.add(`${pList[i][0]},${pList[i][1]}`);
    }
    return set;
  }, [results, astarPath]);

  // Trạng thái từng thuật toán
  const dStatus = !results
    ? "ready"
    : dijkstraPath >= dTotalPath && dijkstraVisited >= dTotalVisited
    ? "completed"
    : "running";

  const aStatus = !results
    ? "ready"
    : astarPath >= aTotalPath && astarVisited >= aTotalVisited
    ? "completed"
    : "running";

  const dProgress = dTotalVisited + dTotalPath > 0
    ? Math.round(((dijkstraVisited + dijkstraPath) / (dTotalVisited + dTotalPath)) * 100)
    : 0;

  const aProgress = aTotalVisited + aTotalPath > 0
    ? Math.round(((astarVisited + astarPath) / (aTotalVisited + aTotalPath)) * 100)
    : 0;

  return (
    <div className="space-y-3.5">
      {/* 1. Unified Control & Config Panel */}
      <GridControlPanel
        gridSize={gridSize}
        setGridSize={setGridSize}
        obstacleDensity={obstacleDensity}
        setObstacleDensity={setObstacleDensity}
        allowDiagonal={allowDiagonal}
        setAllowDiagonal={setAllowDiagonal}
        heuristic={heuristic}
        setHeuristic={setHeuristic}
        onConfigChange={(size, density) => handleGenerateGrid(size, density)}
        loading={loading}
        hasResults={!!results}
        runCompare={runCompare}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        stepBackward={stepBackward}
        stepForward={stepForward}
        skipToEnd={skipToEnd}
        drawMode={drawMode}
        setDrawMode={setDrawMode}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
      />

      {/* 2. Grids Area: TOÀN BỘ CHIỀU RỘNG (100% Full Width 2 Cols) */}
      <div ref={gridAreaRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <AlgorithmGridCard
          title="Dijkstra"
          subtitle="Thuật toán mù (Không dùng Heuristic)"
          colorTheme="blue"
          nodesCount={results ? results.dijkstra.nodes_visited : null}
          found={results ? results.dijkstra.found : null}
          status={dStatus}
          progress={dProgress}

          gridSize={gridSize}
          obstacles={obstaclesSet}
          startPos={startPos}
          goalPos={goalPos}
          visitedNodes={dijkstraVisitedSet}
          pathNodes={dijkstraPathSet}

          interactive={!isPlaying && dijkstraVisited === 0}
          onCellClick={handleCellClick}
          onCellMouseEnter={handleCellMouseEnter}
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
        />

        <AlgorithmGridCard
          title="A*"
          subtitle={`Heuristic: ${heuristic.charAt(0).toUpperCase() + heuristic.slice(1)}`}
          colorTheme="cyan"
          nodesCount={results ? results.astar.nodes_visited : null}
          found={results ? results.astar.found : null}
          status={aStatus}
          progress={aProgress}

          gridSize={gridSize}
          obstacles={obstaclesSet}
          startPos={startPos}
          goalPos={goalPos}
          visitedNodes={astarVisitedSet}
          pathNodes={astarPathSet}

          interactive={!isPlaying && astarVisited === 0}
          onCellClick={handleCellClick}
          onCellMouseEnter={handleCellMouseEnter}
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
        />
      </div>

      {/* 4. Results & KPIs */}
      <ComparisonResults results={results} />
    </div>
  );
}
