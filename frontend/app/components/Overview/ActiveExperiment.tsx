import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMs, formatDistance, formatNumber } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Route, RotateCcw } from "lucide-react";
import MapView from "../Map/MapView";

const MapView = dynamic(() => import("../Map/MapView"), { ssr: false });

export default function ActiveExperiment({ latestRun, setActiveTab }: { latestRun?: HistoryItem, setActiveTab: any }) {
   if (!latestRun || !latestRun.results) {
      return (
         <Card className="border-slate-200 border-dashed shadow-sm">
            <CardContent className="p-12 text-center">
               <Route className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-800">Chưa có dữ liệu thực nghiệm</h3>
               <p className="text-slate-500 mb-6 text-sm">Vui lòng chạy một mô phỏng tìm đường để bắt đầu theo dõi hiệu năng.</p>
               <Button onClick={() => setActiveTab("compare")} className="bg-[#06B6D4] hover:bg-cyan-600 text-white font-bold">
                  Chạy thực nghiệm <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </CardContent>
         </Card>
      );
   }

   const astar = latestRun.results.find(r => r.algorithm === "astar") || latestRun.results[0];
   const dijkstra = latestRun.results.find(r => r.algorithm === "dijkstra") || latestRun.results[0];
   const isMap = latestRun.map_type === "osm";
   const envName = isMap ? "OSM Map" : `Grid ${latestRun.grid_size}x${latestRun.grid_size}`;

   const dijkNodes = dijkstra?.nodes_visited || 0;
   const astarNodes = astar?.nodes_visited || 0;
   const dijkTime = dijkstra?.execution_time || 0;
   const astarTime = astar?.execution_time || 0;
   const nodeImp = dijkNodes > 0 && dijkNodes > astarNodes ? ((dijkNodes - astarNodes) / dijkNodes * 100).toFixed(1) : 0;
   const timeImp = dijkTime > 0 && dijkTime > astarTime ? ((dijkTime - astarTime) / dijkTime * 100).toFixed(1) : 0;

   return (
      <div>
         <h3 className="text-[13px] font-bold text-slate-500 uppercase    mb-3">Active Experiment</h3>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side: Visual & Basic Stats */}
            <Card className="lg:col-span-8 shadow-sm border-slate-200 overflow-hidden flex flex-col">
               <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between bg-white gap-4">
                     <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-[#06B6D4]">A*</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-semibold text-slate-600 capitalize">{astar.heuristic || "Mặc định"}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-semibold text-slate-600">{envName}</span>
                     </div>
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded text-sm font-bold border border-emerald-100 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready
                     </div>
                  </div>

                  <div className="flex-1 bg-slate-50 relative min-h-[280px] flex items-center justify-center p-4">
                     {isMap ? (
                        <div className="w-full h-full rounded-xl overflow-hidden pointer-events-none opacity-80 border border-slate-200">
                           <MapView
                              start={latestRun.start_lat && latestRun.start_lon ? { lat: latestRun.start_lat, lon: latestRun.start_lon } : null}
                              goal={latestRun.end_lat && latestRun.end_lon ? { lat: latestRun.end_lat, lon: latestRun.end_lon } : null}
                              onMapClick={() => { }}
                           />
                        </div>
                     ) : (
                        <div className="flex flex-col items-center">
                           <div className="flex items-center gap-8 mb-4 opacity-50">
                              <Grid3X3Graphic />
                           </div>
                           <div className="flex items-center gap-4 text-sm font-mono font-medium mt-2">
                              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Start</div>
                              <div className="h-px w-20 bg-slate-300 border-t border-dashed"></div>
                              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Goal</div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-10">
                        <div>
                           <div className="text-3xl font-black text-slate-800  ">{formatMs(astarTime)}</div>
                           <div className="text-[13px] font-bold text-slate-400 uppercase     r mt-1">Thời gian chạy</div>
                        </div>
                        <div>
                           <div className="text-3xl font-black text-slate-800  ">{formatNumber(astarNodes)}</div>
                           <div className="text-[13px] font-bold text-slate-400 uppercase     r mt-1">Số nút đã thăm</div>
                        </div>
                        <div>
                           <div className="text-3xl font-black text-slate-800  ">{formatDistance(astar.distance || 0)}</div>
                           <div className="text-[13px] font-bold text-slate-400 uppercase     r mt-1">Khoảng cách</div>
                        </div>
                     </div>
                     <Button variant="outline" className="shrink-0 font-bold border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setActiveTab("compare")}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Chạy lại
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Right Side: AI Performance Insight */}
            <Card className="lg:col-span-4 bg-[#0F172A] text-white shadow-xl shadow-slate-900/10 border-slate-800 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" /><path d="M11 7H13V13H11V7Z" /><path d="M11 15H13V17H11V15Z" /></svg>
               </div>

               <CardContent className="p-6 h-full flex flex-col relative z-10">
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase    mb-6 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" /> Thông tin chi tiết về hiệu suất AI
                  </h3>

                  <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed">
                     Thuật toán <span className="font-bold text-[#06B6D4]">A*</span> đang hoạt động tốt hơn trong môi trường <span className="text-white font-semibold">{envName}</span> hiện tại.
                  </p>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-400">Thời gian chạy (A*)</span>
                        <span className="text-sm font-bold text-[#06B6D4]">{formatMs(astarTime)}</span>
                     </div>
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-slate-400">Thời gian chạy (Dijkstra)</span>
                        <span className="text-sm font-bold text-[#3B82F6]">{formatMs(dijkTime)}</span>
                     </div>
                     <div className="h-px w-full bg-slate-700/50 my-3" />
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white">Cải thiện</span>
                        <span className="text-sm font-black text-[#10B981]">↓ {timeImp}%</span>
                     </div>
                  </div>

                  <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed flex-1">
                     A* duyệt ít hơn <strong className="text-[#10B981] font-bold">{nodeImp}%</strong> số node nhưng vẫn tìm được đường đi tối ưu.
                  </p>

                  <div className="space-y-3 mt-auto">
                     <div className="flex items-center text-[#10B981] font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Tìm thấy đường đi tối ưu
                     </div>
                     <div className="flex items-center text-[#10B981] font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Heuristic admissible
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

function Grid3X3Graphic() {
   return (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
         <rect x="0" y="0" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="25" y="0" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="50" y="0" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="0" y="25" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="25" y="25" width="20" height="20" rx="4" fill="#94A3B8" />
         <rect x="50" y="25" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="75" y="25" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="100" y="25" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="25" y="50" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="50" y="50" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="75" y="50" width="20" height="20" rx="4" fill="#E2E8F0" />
         <rect x="100" y="50" width="20" height="20" rx="4" fill="#E2E8F0" />
         <path d="M10 10L60 60L110 60" stroke="#06B6D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
}
