
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface TableSearchProps<TData> {
  searchColumn?: string;
  table: Table<TData>;
  searchPlaceholder: string;
  isLoading: boolean;
}

export function TableSearch<TData>({
  searchColumn,
  table,
  searchPlaceholder,
  isLoading
}: TableSearchProps<TData>) {
  if (!searchColumn) return null;
  
  return (
    <div className="flex items-center space-x-2">
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
    </div>
  );
}
