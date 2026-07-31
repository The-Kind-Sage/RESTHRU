"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, LayoutGrid, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSpaces, addSpace, renameSpace, deleteSpace } from "@/lib/actions/spaces";
import { getTables } from "@/lib/actions/tables";

type SpaceRow = { id: string; name: string; tableCount: number };

export default function SpacesPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [spaces, setSpaces] = useState<SpaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpaceRow | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpaceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [spaceRes, tableRes] = await Promise.all([
      getSpaces(restaurantId),
      getTables(restaurantId),
    ]);

    // Tables reference a space by name, so the count is derived here rather
    // than joined — matching how renames bulk-update the tables' space string.
    const counts = new Map<string, number>();
    for (const t of ((tableRes as any)?.data ?? []) as any[]) {
      const key = t.space || "";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const rows = (((spaceRes as any)?.data ?? []) as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      tableCount: counts.get(s.name) ?? 0,
    }));
    setSpaces(rows);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? spaces.filter((s) => s.name.toLowerCase().includes(q)) : spaces;
  }, [spaces, search]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (space: SpaceRow) => {
    setEditing(space);
    setName(space.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    if (!name.trim()) return toast.error("Space name is required");
    setSaving(true);
    const res = editing
      ? await renameSpace(editing.id, restaurantId, name.trim())
      : await addSpace(restaurantId, name.trim());
    setSaving(false);
    if ((res as any)?.error) return toast.error((res as any).error);
    toast.success(editing ? "Space renamed" : "Space created");
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget || !restaurantId) return;
    setDeleting(true);
    const res = await deleteSpace(deleteTarget.id, restaurantId);
    setDeleting(false);
    if ((res as any)?.error) return toast.error((res as any).error);
    toast.success("Space deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Space</h1>
          <p className="text-muted-foreground mt-1">
            Group tables into areas — floors, cabins, garden, rooftop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="pl-9 w-full sm:w-52"
            />
          </div>
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No spaces yet</p>
          <p className="text-sm">Create a space to group your tables.</p>
          <Button onClick={openAdd} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" /> Add New
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((space) => (
            <div
              key={space.id}
              className="group rounded-xl border bg-card p-4 flex items-center justify-between transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{space.name}</p>
                <Badge variant="outline" className="mt-1 text-[11px]">
                  {space.tableCount} {space.tableCount === 1 ? "Table" : "Tables"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(space)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(space)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Rename Space" : "Add Space"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Space name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rooftop"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {editing && (
              <p className="text-xs text-muted-foreground">
                Renaming moves all {editing.tableCount} of its tables to the new name.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.tableCount
                ? `This space still has ${deleteTarget.tableCount} table(s). They'll need reassigning.`
                : "This space has no tables."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
