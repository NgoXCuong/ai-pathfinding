import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMs, formatNumber, formatTimeAgo } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function RecentExperiments({ historyList, setActiveTab }: { historyList: HistoryItem[], setActiveTab: any }) {
  if (historyList.length === 0) return null;
  const recent = historyList.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mt-10 mb-4">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase   ">Recent Experiments</h3>
        <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")} className="text-sm h-8 text-slate-500 hover:text-slate-900 font-bold">
          Xem toàn bộ lịch sử <ArrowRight className="w-3 h-3 ml-1.5" />
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden mb-8">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
              {recent.map((run) => {
                const astar = run.results.find(r => r.algorithm === "astar") || run.results[0];
                const envName = run.map_type === "osm" ? "OSM Map" : `Grid ${run.grid_size}x${run.grid_size}`;

                return (
                  <tr key={run.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setActiveTab("history")}>
                    <td className="px-6 py-4 font-bold text-[#06B6D4]">A* <span className="text-slate-300 mx-2 font-normal">/</span> <span className="text-slate-600 font-semibold">{envName}</span></td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">{formatMs(astar?.execution_time || 0)}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{formatNumber(astar?.nodes_visited || 0)} nodes</td>
                    <td className="px-6 py-4 text-right text-[13px] font-bold uppercase     r text-slate-400 group-hover:text-slate-600 transition-colors">
                      {formatTimeAgo(run.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
