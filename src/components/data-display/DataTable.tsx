
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  SearchIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  isLoading = false,
  onRowSelectionChange,
  bulkActions,
  onRowClick,
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

  // Handle row click
  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchColumn && (
            <div className="relative w-64">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                }
                className="pl-8"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {bulkActions && bulkActions.length > 0 && table.getFilteredSelectedRowModel().rows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkActions.map((action, index) => (
                  <DropdownMenuItem 
                    key={index}
                    onClick={() => {
                      const selectedRowKeys = Object.keys(rowSelection).filter(
                        (key) => rowSelection[key]
                      );
                      const selectedRowIds = selectedRowKeys.map((idx) => {
                        const rowData = data[parseInt(idx)];
                        return (rowData as any).id;
                      });
                      action.action(selectedRowIds);
                    }}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <p className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-left">
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
                  className={`hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows?.length} of{" "}
            {table.getFilteredRowModel().rows.length} result(s)
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
