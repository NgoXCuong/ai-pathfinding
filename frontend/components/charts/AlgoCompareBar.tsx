"use client"

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

const DIJKSTRA_COLOR = "#3b82f6" // blue-500
const ASTAR_COLOR = "#06b6d4"    // cyan-500

interface AlgoCompareBarProps {
  /** Nhãn chỉ số (vd: "Nút đã duyệt", "Thời gian") */
  label: string
  dijkstra: number
  astar: number
  /** Định dạng giá trị hiển thị trên cột (vd: ms, %, km) */
  formatValue: (v: number) => string
  /** Badge cải thiện, vd "↓ 70.2%" */
  improvement?: string
  /** Hiển thị "tương đương" khi 2 giá trị bằng nhau */
  equal?: boolean
  /** Chế độ nhỏ gọn cho overlay card */
  compact?: boolean
}

/**
 * Biểu đồ cột so sánh Dijkstra vs A* cho một chỉ số duy nhất.
 * Dùng thay cho các KPI card để trực quan hóa kết quả so sánh.
 */
export default function AlgoCompareBar({
  label,
  dijkstra,
  astar,
  formatValue,
  improvement,
  equal = false,
  compact = false,
}: AlgoCompareBarProps) {
  const data = [
    { name: "Dijkstra", value: dijkstra, fill: DIJKSTRA_COLOR },
    { name: "A*", value: astar, fill: ASTAR_COLOR },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-1">
        <p className="text-center text-xs font-semibold uppercase text-slate-500">{label}</p>
        {improvement && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
            {improvement}
          </span>
        )}
        {equal && !improvement && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
            = Tương đương
          </span>
        )}
      </div>
      <div className={cn("w-full", compact ? "h-[104px]" : "h-[150px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 6, left: 6, bottom: 0 }} barCategoryGap="28%">
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }}
            />
            <YAxis hide domain={[0, (dataMax: number) => dataMax * 1.18]} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.12)" }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                fontSize: 12,
                fontWeight: 600,
              }}
              formatter={(value) => [formatValue(Number(value)), ""]}
              labelStyle={{ display: "none" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v) => formatValue(Number(v))}
                style={{ fontSize: compact ? 11 : 13, fontWeight: 800, fill: "#334155" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
