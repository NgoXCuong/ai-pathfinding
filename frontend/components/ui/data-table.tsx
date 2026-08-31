"use client"
"use no memo"

import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Lấy id ổn định cho mỗi row (tránh lỗi key trùng khi dữ liệu lặp). */
  getRowId?: (row: TData) => string
  /** Custom className cho từng row (vd highlight row đang được chọn). */
  getRowClassName?: (row: TData) => string | undefined
  enableSorting?: boolean
  emptyMessage?: React.ReactNode
  className?: string
}

/**
 * DataTable — bảng dữ liệu chuẩn shadcn/ui dựa trên TanStack Table.
 * Hỗ trợ sorting (bấm tiêu đề cột) và render cell tùy biến qua ColumnDef.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  getRowClassName,
  enableSorting = true,
  emptyMessage = "Không có dữ liệu.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting,
  })

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="whitespace-nowrap py-3 px-5 font-semibold text-sm text-slate-400 uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn("hover:bg-slate-50", getRowClassName?.(row.original))}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-5 py-2.5 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-slate-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Header cột có nút sắp xếp (asc/desc) khi click.
 * Dùng trong ColumnDef: header: ({ column }) => <SortableHeader column={column}>Tên cột</SortableHeader>
 */
export function SortableHeader({
  column,
  children,
  className,
}: {
  column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" }
  children: React.ReactNode
  className?: string
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 px-2 hover:bg-slate-100 uppercase", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
      title="Sắp xếp"
    >
      {children}
      <ArrowUpDown className={cn("ml-1.5 h-3.5 w-3.5", sorted ? "text-indigo-600" : "text-slate-400")} />
    </Button>
  )
}
