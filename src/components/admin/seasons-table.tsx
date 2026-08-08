"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { deleteSeasonAction } from "@/lib/actions/season-actions";
import { formatDate } from "@/lib/utils";
import type { Season } from "@/lib/api/types";

/** Client Component: renders the server-fetched season list and handles delete (server action + router.refresh to resync). */
export function SeasonsTable({ initialSeasons }: { initialSeasons: Season[] }) {
  const router = useRouter();
  const [seasons, setSeasons] = React.useState(initialSeasons);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSeasons(initialSeasons);
  }, [initialSeasons]);

  async function handleDelete(season: Season) {
    if (!window.confirm(`Delete "${season.name}"? This can't be undone.`)) return;
    setError(null);
    setPendingId(season.id);
    const result = await deleteSeasonAction(season.id);
    setPendingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSeasons((prev) => prev.filter((s) => s.id !== season.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start date</TableHead>
            <TableHead>End date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="w-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.map((season) => {
            const isPending = pendingId === season.id;
            return (
              <TableRow key={season.id}>
                <TableCell className="font-medium">
                  <span dir="auto">{season.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(season.startDate)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(season.endDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{season.priority}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete season"
                      disabled={pendingId !== null}
                      onClick={() => handleDelete(season)}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
