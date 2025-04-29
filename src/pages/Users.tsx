
  // Selection column
  const selectionColumn = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value);
          const rowSelection = table.getState().rowSelection;
          const selectedIds = Object.keys(rowSelection).map(
            (index) => {
              const row = table.getRow(index);
              return row.original ? row.original.id : undefined;
            }
          ).filter(Boolean) as string[];
          setSelectedUsers(selectedIds);
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          
          // Update selectedUsers state based on current selection
          const table = row.getTable();
          const rowSelection = table.getState().rowSelection;
          const selectedIds = Object.keys(rowSelection).map(
            (index) => {
              const row = table.getRow(index);
              return row.original ? row.original.id : undefined;
            }
          ).filter(Boolean) as string[];
          setSelectedUsers(selectedIds);
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
