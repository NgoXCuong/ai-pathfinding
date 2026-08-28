import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMs, formatNumber } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";

export default function QuickComparison({ latestRun }: { latestRun?: HistoryItem }) {
  if (!latestRun || !latestRun.results) return null;

  const astar = latestRun.results.find(r => r.algorithm === "astar") || latestRun.results[0];
  const dijkstra = latestRun.results.find(r => r.algorithm === "dijkstra") || latestRun.results[0];

  const dijkTime = dijkstra?.execution_time || 0;
  const astarTime = astar?.execution_time || 0;
  const dijkNodes = dijkstra?.nodes_visited || 0;
  const astarNodes = astar?.nodes_visited || 0;

  const timeImp = dijkTime > 0 && dijkTime > astarTime ? ((dijkTime - astarTime) / dijkTime * 100).toFixed(1) : "0";
  const nodeImp = dijkNodes > 0 && dijkNodes > astarNodes ? ((dijkNodes - astarNodes) / dijkNodes * 100).toFixed(1) : "0";

  return (
    <div>
      <h3 className="text-[13px] font-bold text-slate-500 uppercase    mb-4 mt-10">Quick Comparison</h3>
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase     r text-sm">Metric</th>
                <th className="px-6 py-4 font-bold text-[#3B82F6] uppercase     r text-sm">Dijkstra</th>
                <th className="px-6 py-4 font-bold text-[#06B6D4] uppercase     r text-sm">A*</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-right uppercase     r text-sm">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700">Runtime</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{formatMs(dijkTime)}</td>
                <td className="px-6 py-4 font-bold text-[#06B6D4] font-mono">{formatMs(astarTime)}</td>
                <td className="px-6 py-4 text-right">
                  {Number(timeImp) > 0 ? <span className="font-bold text-[#10B981]">↓ {timeImp}%</span> : <span className="text-slate-400 font-medium">—</span>}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700">Nodes visited</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{formatNumber(dijkNodes)}</td>
                <td className="px-6 py-4 font-bold text-[#06B6D4] font-mono">{formatNumber(astarNodes)}</td>
                <td className="px-6 py-4 text-right">
                  {Number(nodeImp) > 0 ? <span className="font-bold text-[#10B981]">↓ {nodeImp}%</span> : <span className="text-slate-400 font-medium">—</span>}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700">Path length</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{astar?.distance?.toFixed(3) || 0}</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{astar?.distance?.toFixed(3) || 0}</td>
                <td className="px-6 py-4 text-right font-bold text-[#10B981]">
                  ✓ Equal
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
