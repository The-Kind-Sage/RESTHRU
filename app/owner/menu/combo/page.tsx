"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Search, SlidersHorizontal, Plus, FileText, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getCombos, deleteCombo, toggleComboAvailable } from "@/lib/actions/combos";
import { portalBase } from '@/lib/portal';

type ComboRow = {
  id: string;
  name: string;
  menuSection: string | null;
  comboType: string | null;
  offerPrice: number;
  prepTime: number;
  isAvailable: boolean;
  imageUrl: string | null;
  category: { name: string } | null;
};

export default function ComboOfferPage() {
  const router = useRouter();
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ComboRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const res = await getCombos(restaurantId);
    if ("error" in res && res.error) toast.error(res.error);
    else if (res.data) setCombos(res.data as ComboRow[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? combos.filter((c) => c.name.toLowerCase().includes(q)) : combos;
  }, [combos, search]);

  const onToggle = async (combo: ComboRow, val: boolean) => {
    setCombos((prev) => prev.map((c) => (c.id === combo.id ? { ...c, isAvailable: val } : c)));
    const res = await toggleComboAvailable(combo.id, val);
    if ("error" in res && res.error) {
      toast.error(res.error);
      setCombos((prev) => prev.map((c) => (c.id === combo.id ? { ...c, isAvailable: !val } : c)));
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCombo(deleteTarget.id);
    setDeleting(false);
    if ("error" in res && res.error) toast.error(res.error);
    else {
      toast.success("Combo deleted");
      setDeleteTarget(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Combo Offer</h1>
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
          <Button variant="outline" className="gap-1.5" disabled>
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </Button>
          <Button onClick={() => router.push(`${portalBase()}/menu/combo/create`)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                <th className="text-left px-4 py-3">SN</th>
                <th className="text-left px-4 py-3">Combo Name</th>
                <th className="text-left px-4 py-3">Preparation Time</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Sub Menu</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-center px-4 py-3">Available</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={9} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center text-center py-20">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                        <FileText className="h-9 w-9 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-bold">No Combo Offer found</p>
                      <p className="text-muted-foreground mt-1">Create a new Combo Offer.</p>
                      <Button onClick={() => router.push(`${portalBase()}/menu/combo/create`)} className="mt-5 gap-1.5">
                        <Plus className="h-4 w-4" /> Add New
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((combo, idx) => (
                  <tr key={combo.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                          {combo.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={combo.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {combo.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{combo.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{combo.prepTime} min</td>
                    <td className="px-4 py-3 text-muted-foreground">{combo.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {combo.comboType ? (
                        <Badge variant="outline" className="text-xs font-normal">{combo.comboType}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{combo.menuSection || "—"}</td>
                    <td className="px-4 py-3 font-medium">Rs {combo.offerPrice}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Switch checked={combo.isAvailable} onCheckedChange={(v) => onToggle(combo, v)} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(combo)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "" : `${filtered.length} combo${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the combo offer. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
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
