
import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "./TablePagination";
import { TableSearch } from "./TableSearch";
import { TableBulkActions } from "./TableBulkActions";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onRowSelectionChange?: (selectedRowIds: string[]) => void;
  bulkActions?: {
    label: string;
    action: (selectedRowIds: string[]) => void;
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  isLoading = false,
  onRowSelectionChange,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: (updatedRowSelection) => {
      setRowSelection(updatedRowSelection);
      if (onRowSelectionChange) {
        // Extract the IDs of selected rows and pass to the callback
        const selectedRowKeys = Object.keys(updatedRowSelection).filter(
          (key) => updatedRowSelection[key]
        );
        const selectedRowIds = selectedRowKeys.map((idx) => {
          const rowData = data[parseInt(idx)];
          return (rowData as any).id;
        });
        onRowSelectionChange(selectedRowIds);
      }
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4">
      {/* Table actions */}
      <div className="flex items-center justify-between">
        <TableSearch
          searchColumn={searchColumn}
          table={table}
          searchPlaceholder={searchPlaceholder}
          isLoading={isLoading}
        />
        
        <TableBulkActions
          table={table}
          bulkActions={bulkActions}
          data={data}
          rowSelection={rowSelection}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination table={table} isLoading={isLoading} />
    </div>
  );
}

// Make sure to import Loader2
import { Loader2 } from "lucide-react";
