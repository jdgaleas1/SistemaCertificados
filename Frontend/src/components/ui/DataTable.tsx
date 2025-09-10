"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { Card, Table, Button, Text } from "@radix-ui/themes";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  persistStateKey?: string; // Key for localStorage persistence
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  persistStateKey,
}: DataTableProps<TData, TValue>) {
  // Initialize state with localStorage values if available
  const getInitialState = (key: string, defaultValue: any) => {
    if (typeof window === "undefined" || !persistStateKey) return defaultValue;
    try {
      const saved = localStorage.getItem(`datatable_${persistStateKey}_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [sorting, setSorting] = useState<SortingState>(() => 
    getInitialState("sorting", [])
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => 
    getInitialState("columnFilters", [])
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => 
    getInitialState("columnVisibility", {})
  );
  const [globalFilter, setGlobalFilter] = useState(() => 
    getInitialState("globalFilter", "")
  );

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !persistStateKey) return;
    localStorage.setItem(`datatable_${persistStateKey}_sorting`, JSON.stringify(sorting));
  }, [sorting, persistStateKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !persistStateKey) return;
    localStorage.setItem(`datatable_${persistStateKey}_columnFilters`, JSON.stringify(columnFilters));
  }, [columnFilters, persistStateKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !persistStateKey) return;
    localStorage.setItem(`datatable_${persistStateKey}_columnVisibility`, JSON.stringify(columnVisibility));
  }, [columnVisibility, persistStateKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !persistStateKey) return;
    localStorage.setItem(`datatable_${persistStateKey}_globalFilter`, JSON.stringify(globalFilter));
  }, [globalFilter, persistStateKey]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  const getSortIcon = (isSorted: false | "asc" | "desc") => {
    if (isSorted === "asc") return <ArrowUp size={14} />;
    if (isSorted === "desc") return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} />;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table.Root>
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.ColumnHeaderCell key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-2 hover:bg-gray-50 p-1 rounded"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {getSortIcon(header.column.getIsSorted())}
                          </span>
                        )}
                      </div>
                    )}
                  </Table.ColumnHeaderCell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Table.Row
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Text className="text-gray-500">No hay resultados.</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text size="2" className="text-gray-600">
            Mostrando{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            a{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            de {table.getFilteredRowModel().rows.length} resultados
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="soft"
            size="2"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="soft"
            size="2"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="flex items-center gap-1">
            <Text size="2">Página</Text>
            <Text size="2" weight="bold">
              {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </Text>
          </div>

          <Button
            variant="soft"
            size="2"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="soft"
            size="2"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
