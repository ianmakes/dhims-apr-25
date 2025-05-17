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
import { Checkbox } from "@/components/ui/checkbox";

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

  // Prepare columns with selection
  const selectionColumns = bulkActions
    ? [
        {
          id: "select",
          header: ({ table }: any) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="translate-y-[2px]"
            />
          ),
          cell: ({ row }: any) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
              className="translate-y-[2px]"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
      ]
    : [];

  const allColumns = [...selectionColumns, ...columns];

  const table = useReactTable({
    data,
    columns: allColumns,
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
    enableRowSelection: Boolean(bulkActions),
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
                className="pl-8 border-wp-border focus:border-wp-primary focus:ring-1 focus:ring-wp-primary"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {bulkActions && bulkActions.length > 0 && table.getFilteredSelectedRowModel().rows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="wp-secondary" size="sm">
                  Bulk Actions ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-wp-border">
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
                    className="hover:bg-wp-gray-50"
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <p className="text-sm text-wp-text-secondary">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="wp-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-left font-medium text-wp-text-primary bg-wp-gray-50">
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
                  colSpan={allColumns.length}
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
                  className={`hover:bg-wp-gray-50 transition-colors border-b border-wp-border ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-24 text-center text-wp-text-secondary"
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
          <p className="text-sm text-wp-text-secondary">
            Showing {table.getRowModel().rows?.length} of{" "}
            {table.getFilteredRowModel().rows.length} result(s)
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-wp-text-secondary">Rows per page</p>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-16 border-wp-border">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-wp-border">
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
            className="border-wp-border"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
            className="border-wp-border"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-wp-text-secondary">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
            className="border-wp-border"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || isLoading}
            className="border-wp-border"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
