"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Heuristic, DrawMode } from "@/lib/types";
import { generateGrid, compareAlgorithms, saveHistory } from "@/lib/api";
import GridControlPanel from "./GridControlPanel";
import AlgorithmGridCard from "./AlgorithmGridCard";
import ComparisonResults from "./ComparisonResults";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, Play, Pause, StepBack, StepForward, SkipForward } from "lucide-react";

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
  const [results, setResults] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [isSynced, setIsSynced] = useState(true); // Always true currently as logic is synced by visitedProgress

  // Progress State
  const [visitedProgress, setVisitedProgress] = useState(0);
  const [pathProgress, setPathProgress] = useState(0);

  const maxVisited = results ? Math.max(results.dijkstra.visited_order?.length || 0, results.astar.visited_order?.length || 0) : 0;
  const maxPath = results ? Math.max(results.dijkstra.path?.length || 0, results.astar.path?.length || 0) : 0;

  // INITIALIZATION
  useEffect(() => {
    if (!initialized) {
      handleGenerateGrid(20, 0.25);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const handleGenerateGrid = async (size = gridSize, density = obstacleDensity) => {
    try {
      const res = await generateGrid(size, density);
      setObstacles(res.obstacles);
      setStartPos([0, 0]);
      setGoalPos([size - 1, size - 1]);
      resetAll();
    } catch (err) {
      console.error("Generate grid error", err);
    }
  };

  const resetAll = () => {
    setResults(null);
    setIsPlaying(false);
    setVisitedProgress(0);
    setPathProgress(0);
  };

  // GRID INTERACTION HANDLERS
  const handleCellClick = useCallback((r: number, c: number) => {
    if (isPlaying || visitedProgress > 0) return; // Prevent edit during/after run
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
  }, [isPlaying, visitedProgress, drawMode, startPos, goalPos, obstacles]);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (!isMouseDown || isPlaying || visitedProgress > 0) return;
    handleCellClick(r, c);
  }, [isMouseDown, isPlaying, visitedProgress, handleCellClick]);

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
    } catch (err: any) {
      alert("Lỗi khi tìm đường: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ANIMATION CONTROLS
  const stepForward = () => {
    if (!results) return;
    setIsPlaying(false);
    if (visitedProgress < maxVisited) {
      setVisitedProgress(p => Math.min(maxVisited, p + 1));
    } else if (pathProgress < maxPath) {
      setPathProgress(p => Math.min(maxPath, p + 1));
    }
  };

  const stepBackward = () => {
    if (!results) return;
    setIsPlaying(false);
    if (pathProgress > 0) {
      setPathProgress(p => Math.max(0, p - 1));
    } else if (visitedProgress > 0) {
      setVisitedProgress(p => Math.max(0, p - 1));
    }
  };

  const skipToEnd = () => {
    if (!results) return;
    setIsPlaying(false);
    setVisitedProgress(maxVisited);
    setPathProgress(maxPath);
  };

  // MAIN ANIMATION LOOP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && results) {
      interval = setInterval(() => {
        if (visitedProgress < maxVisited) {
          setVisitedProgress(prev => {
            const baseBatch = Math.max(1, Math.ceil(maxVisited / 120));
            const speedMultiplier = animationSpeed === 100 ? 5 : Math.max(0.2, animationSpeed / 50);
            const batch = Math.floor(baseBatch * speedMultiplier);
            const next = prev + batch;
            if (next >= maxVisited) return maxVisited;
            return next;
          });
        } else if (pathProgress < maxPath) {
          setPathProgress(prev => {
            const next = prev + 1;
            if (next >= maxPath) {
              setIsPlaying(false);
              return maxPath;
            }
            return next;
          });
        } else {
          setIsPlaying(false);
        }
      }, 20);
    }
    return () => clearInterval(interval);
  }, [isPlaying, results, visitedProgress, pathProgress, maxVisited, maxPath, animationSpeed]);

  // DERIVED DATA FOR GRID RENDER
  const obstaclesSet = new Set(obstacles.map(([r, c]) => `${r},${c}`));

  const dijkstraVisitedSet = new Set<string>();
  const dijkstraPathSet = new Set<string>();
  if (results) {
    const dVisited = results.dijkstra.visited_order || [];
    const dLimit = Math.min(visitedProgress, dVisited.length);
    for (let i = 0; i < dLimit; i++) {
      if (dVisited[i]) dijkstraVisitedSet.add(`${dVisited[i][0]},${dVisited[i][1]}`);
    }

    const dPath = results.dijkstra.path || [];
    const dPathLimit = Math.min(pathProgress, dPath.length);
    for (let i = 0; i < dPathLimit; i++) {
      if (dPath[i]) dijkstraPathSet.add(`${dPath[i][0]},${dPath[i][1]}`);
    }
  }

  const astarVisitedSet = new Set<string>();
  const astarPathSet = new Set<string>();
  if (results) {
    const aVisited = results.astar.visited_order || [];
    const aLimit = Math.min(visitedProgress, aVisited.length);
    for (let i = 0; i < aLimit; i++) {
      if (aVisited[i]) astarVisitedSet.add(`${aVisited[i][0]},${aVisited[i][1]}`);
    }

    const aPath = results.astar.path || [];
    const aPathLimit = Math.min(pathProgress, aPath.length);
    for (let i = 0; i < aPathLimit; i++) {
      if (aPath[i]) astarPathSet.add(`${aPath[i][0]},${aPath[i][1]}`);
    }
  }

  // Determine Status
  const getStatus = (visitedLen: number, pathLen: number) => {
    if (!results) return "ready";
    if (pathProgress >= pathLen && visitedProgress >= visitedLen) return "completed";
    return "running";
  };

  const dStatus = getStatus(results?.dijkstra.visited_order?.length || 0, results?.dijkstra.path?.length || 0);
  const aStatus = getStatus(results?.astar.visited_order?.length || 0, results?.astar.path?.length || 0);

  // Progress calculations
  const calculateProgress = (algData: any) => {
    if (!algData) return 0;
    const vLen = algData.visited_order?.length || 0;
    const pLen = algData.path?.length || 0;
    const totalSteps = vLen + pLen;
    if (totalSteps === 0) return 0;

    const currentSteps = Math.min(visitedProgress, vLen) + Math.min(pathProgress, pLen);
    return Math.round((currentSteps / totalSteps) * 100);
  };

  const dProgress = calculateProgress(results?.dijkstra);
  const aProgress = calculateProgress(results?.astar);

  return (
    <div className="space-y-6">
      {/* 1. Control Panel */}
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
        hasResults={!!results}
        loading={loading}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        isSynced={isSynced}
        setIsSynced={setIsSynced}
      />

      {/* 2. Grids Area & Legend */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        {/* Left Side: Grids */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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

            interactive={!isPlaying && visitedProgress === 0}
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

            interactive={!isPlaying && visitedProgress === 0}
            onCellClick={handleCellClick}
            onCellMouseEnter={handleCellMouseEnter}
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          />
        </div>

        {/* Right Side: Tools & Legend */}
        <div className="w-full xl:w-[160px] shrink-0 flex flex-col gap-5">

          {/* Action Tools */}
          <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-sm font-bold text-slate-400 uppercase     r border-b border-slate-100 pb-2">Điều khiển</div>

            <Button size="sm" onClick={runCompare} disabled={loading} className="w-full h-9 font-semibold shadow-sm rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? <Clock className="w-4 h-4 animate-spin mr-1.5" /> : (!!results ? <RotateCcw className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />)}
              {!!results ? "Chạy Lại" : "Chạy"}
            </Button>

            {!!results && (
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant="secondary" size="sm" className="w-full rounded-full shadow-sm bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <><Pause className="w-4 h-4 mr-1.5" /> Tạm dừng</> : <><Play className="w-4 h-4 mr-1.5" /> Tiếp tục</>}
                </Button>

                <div className="flex items-center justify-between gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm mt-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-900 bg-white shadow-sm" onClick={stepBackward} title="Lùi">
                    <StepBack className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-900 bg-white shadow-sm" onClick={stepForward} title="Tiến">
                    <StepForward className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-900 bg-white shadow-sm" onClick={skipToEnd} title="Bỏ qua">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="text-sm font-bold text-slate-400 uppercase     r border-b border-slate-100 pb-2 mt-3">Công cụ vẽ</div>
            <div className="flex flex-col gap-1.5">
              {([
                { mode: "obstacle" as DrawMode, label: "🧱 Vẽ Cản" },
                { mode: "erase" as DrawMode, label: "🧹 Xóa" },
                { mode: "start" as DrawMode, label: "🟢 Bắt đầu" },
                { mode: "goal" as DrawMode, label: "🔴 Kết thúc" },
              ]).map((tool) => (
                <Button
                  key={tool.mode}
                  variant={drawMode === tool.mode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDrawMode(tool.mode)}
                  className={`w-full justify-start h-8 font-medium ${drawMode === tool.mode ? 'bg-slate-200 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {tool.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-row xl:flex-col items-center xl:items-start justify-center xl:justify-start gap-4 xl:gap-4 text-sm font-medium text-slate-600 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <div className="hidden xl:block text-sm font-bold text-slate-400 uppercase     r w-full border-b border-slate-100 pb-2">Ký hiệu</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded bg-slate-400 shadow-sm shrink-0"></span> Chướng ngại vật</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded bg-blue-300 shadow-sm shrink-0"></span> Đã duyệt</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded bg-purple-600 shadow-sm shrink-0"></span> Đường đi</div>
          </div>
        </div>
      </div>

      {/* 4. Results & KPIs */}
      <ComparisonResults results={results} />
    </div>
  );
}
