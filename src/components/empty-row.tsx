import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}
