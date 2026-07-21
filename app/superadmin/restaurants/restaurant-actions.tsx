'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  setRestaurantStatus,
  updateRestaurant,
  deleteRestaurant,
  createRestaurantWithOwner,
} from '@/lib/actions/admin';

export type RestaurantRow = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  type: string;
  isActive: boolean;
};

// Restaurant "type" is stored as an uppercase enum-ish string. Offer the common
// values; if a row's current type isn't in the list, it's prepended so editing
// never silently drops it.
const TYPE_OPTIONS = [
  'RESTAURANT',
  'CAFE',
  'BAR',
  'FAST_FOOD',
  'BAKERY',
  'CASUAL_DINING',
  'FINE_DINING',
  'CLOUD_KITCHEN',
  'MIXED',
];

export function RestaurantActions({ restaurant }: { restaurant: RestaurantRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const [form, setForm] = useState({
    name: restaurant.name ?? '',
    email: restaurant.email ?? '',
    phoneNumber: restaurant.phoneNumber ?? '',
    street: restaurant.street ?? '',
    city: restaurant.city ?? '',
    state: restaurant.state ?? '',
    type: restaurant.type ?? 'RESTAURANT',
  });

  const typeOptions = TYPE_OPTIONS.includes(form.type)
    ? TYPE_OPTIONS
    : [form.type, ...TYPE_OPTIONS];

  const setStatus = (isActive: boolean) => {
    startTransition(async () => {
      const res = await setRestaurantStatus(restaurant.id, isActive);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        isActive
          ? `${restaurant.name} reopened — its team can sign in again`
          : `${restaurant.name} closed — owner, reception and waiter logins are now blocked`
      );
      setCloseOpen(false);
      router.refresh();
    });
  };

  const saveEdit = () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    startTransition(async () => {
      const res = await updateRestaurant(restaurant.id, form);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Restaurant updated');
      setEditOpen(false);
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const res = await deleteRestaurant(restaurant.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${restaurant.name} and all its data were deleted`);
      setDeleteOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Actions for ${restaurant.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/superadmin/restaurants/${restaurant.id}`} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {restaurant.isActive ? (
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setCloseOpen(true);
              }}
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Close restaurant
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="cursor-pointer text-primary focus:text-primary"
              onSelect={(e) => {
                e.preventDefault();
                setStatus(true);
              }}
            >
              <Power className="mr-2 h-4 w-4" />
              Reopen restaurant
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit restaurant</DialogTitle>
            <DialogDescription>Update the profile for {restaurant.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="r-name">Name</Label>
              <Input
                id="r-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="r-email">Email</Label>
                <Input
                  id="r-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-phone">Phone</Label>
                <Input
                  id="r-phone"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-street">Address</Label>
              <Input
                id="r-street"
                value={form.street}
                onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="r-city">City</Label>
                <Input
                  id="r-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-state">State</Label>
                <Input
                  id="r-state"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger id="r-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close confirmation */}
      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close {restaurant.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              While closed, the owner, reception and waiter accounts for this restaurant
              cannot sign in, and anyone already signed in is locked out. You can reopen it
              at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                setStatus(false);
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close restaurant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {restaurant.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the restaurant along with its staff, menu, orders,
              bills and all other data — including the owner, reception and waiter accounts.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// "Add restaurant" — the Create half of the Action column's CRUD. Provisions a
// new restaurant plus the owner login that will run it, in one step.
export function AddRestaurantButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'RESTAURANT',
    email: '',
    phoneNumber: '',
    city: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
  });

  const reset = () =>
    setForm({
      name: '',
      type: 'RESTAURANT',
      email: '',
      phoneNumber: '',
      city: '',
      ownerFirstName: '',
      ownerLastName: '',
      ownerEmail: '',
      ownerPassword: '',
    });

  const submit = () => {
    startTransition(async () => {
      const res = await createRestaurantWithOwner(form);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${form.name} created with its owner login`);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add restaurant</DialogTitle>
          <DialogDescription>
            Create a restaurant and the owner account that will sign in to run it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Restaurant name</Label>
            <Input
              id="new-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Everest Diner"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger id="new-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-city">City</Label>
              <Input
                id="new-city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input
                id="new-phone"
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">Restaurant email</Label>
            <Input
              id="new-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-3">Owner login</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-owner-first">First name</Label>
                <Input
                  id="new-owner-first"
                  value={form.ownerFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerFirstName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-owner-last">Last name</Label>
                <Input
                  id="new-owner-last"
                  value={form.ownerLastName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerLastName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-owner-email">Owner email (Gmail)</Label>
                <Input
                  id="new-owner-email"
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                  placeholder="name@gmail.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-owner-pass">Password</Label>
                <Input
                  id="new-owner-pass"
                  type="password"
                  value={form.ownerPassword}
                  onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create restaurant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
