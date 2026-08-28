import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PerformanceTrends({ historyList }: { historyList: HistoryItem[] }) {
  if (historyList.length === 0) return null;

  // Lấy 10 run gần nhất, sort cũ trước mới sau
  const last10 = historyList.slice(0, 10).reverse();
  const data = last10.map((run, i) => {
    const astar = run.results.find(r => r.algorithm === "astar");
    const dijk = run.results.find(r => r.algorithm === "dijkstra");
    return {
      name: `Run ${i + 1}`,
      astarTime: astar?.execution_time || 0,
      dijkstraTime: dijk?.execution_time || 0,
      astarNodes: astar?.nodes_visited || 0,
      dijkstraNodes: dijk?.nodes_visited || 0,
    };
  });

  return (
    <div>
      <h3 className="text-[13px] font-bold text-slate-500 uppercase    mb-4 mt-10">Algorithm Performance</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <h4 className="text-sm font-bold text-slate-800 mb-6">Runtime (ms)</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                    labelStyle={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 10 }} />
                  <Line type="monotone" name="Dijkstra" dataKey="dijkstraTime" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="A*" dataKey="astarTime" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[13px] font-bold text-slate-400 mt-2 uppercase     r">Last {data.length} runs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <h4 className="text-sm font-bold text-slate-800 mb-6">Nodes Visited</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                    labelStyle={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 10 }} />
                  <Line type="monotone" name="Dijkstra" dataKey="dijkstraNodes" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="A*" dataKey="astarNodes" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[13px] font-bold text-slate-400 mt-2 uppercase     r">Last {data.length} runs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
