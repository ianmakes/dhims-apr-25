
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TableBulkActionsProps<TData> {
  table: Table<TData>;
  bulkActions?: {
    label: string;
    action: (selectedRowIds: string[]) => void;
  }[];
  data: TData[];
  rowSelection: Record<string, boolean>;
}

export function TableBulkActions<TData>({
  table,
  bulkActions,
  data,
  rowSelection
}: TableBulkActionsProps<TData>) {
  return (
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
  );
}
