'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  QrCode,
  Search,
  ChevronDown,
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Upload,
  X,
  UserPlus,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate, formatCurrency } from '@/lib/format';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import {
  createReceptionLogin, getReceptionLogins, deactivateReceptionLogin, deleteReceptionLogin,
  createWaiterLogin, getWaiterLogins, deactivateWaiterLogin, deleteWaiterLogin,
} from '@/lib/actions/auth';
import { getStaff, addStaff, deleteStaff } from '@/lib/actions/staff';
import { useUpgradeStore } from '@/store/upgrade-store';

interface StaffMember {
  id: number | string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  joinedDate: string;
  salary: number;
  avatar: string;
  avatarUrl?: string | null;
}

// No mock data — staff will be loaded from the database
const mockStaffMembers: StaffMember[] = [];

const roleColors: { [key: string]: string } = {
  WAITER: 'bg-primary-light text-primary',
  KITCHEN: 'bg-accent-light text-warning',
  CASHIER: 'bg-primary-light text-primary',
  MANAGER: 'bg-primary-light text-primary',
  RECEPTIONIST: 'bg-primary-light text-primary',
  BARTENDER: 'bg-primary-light text-primary',
  CHEF: 'bg-accent-light text-warning',
  COOK: 'bg-accent-light text-warning',
  BUSSER: 'bg-primary-light text-primary',
  HOUSEKEEPER: 'bg-primary-light text-primary',
};

const avatarBgColors: { [key: string]: string } = {
  WAITER: 'bg-primary',
  KITCHEN: 'bg-accent',
  CASHIER: 'bg-primary',
  MANAGER: 'bg-primary',
  RECEPTIONIST: 'bg-primary',
  BARTENDER: 'bg-primary',
  CHEF: 'bg-accent',
  COOK: 'bg-accent',
  BUSSER: 'bg-primary',
  HOUSEKEEPER: 'bg-primary',
};

// Roles whose staff sign in to a console, and which action issues that login.
// Other roles (kitchen, cashier, manager) are directory-only — there is no
// console for them to sign in to, so Add Staff never asks for credentials.
const LOGIN_CAPABLE_ROLES: Record<
  string,
  {
    createLogin: (d: { firstName: string; lastName?: string; username: string; password: string }) => Promise<any>;
    consoleLabel: string;
  }
> = {
  waiter: { createLogin: createWaiterLogin, consoleLabel: 'the order station' },
  receptionist: { createLogin: createReceptionLogin, consoleLabel: 'the reception console' },
};

function StaffAvatar({
  initials,
  role,
}: {
  initials: string;
  role: string;
}) {
  return (
    <div
      className={`${avatarBgColors[role] || 'bg-muted'} h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
    >
      {initials}
    </div>
  );
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function StaffDetailDialog({ staff, open, onOpenChange }: { staff: StaffMember; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showSalary, setShowSalary] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className={`${avatarBgColors[staff.role] || 'bg-muted'} h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl`}
            >
              {staff.avatar}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{staff.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge className={roleColors[staff.role]}>
                {formatRole(staff.role)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{staff.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{staff.email}</p>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSalary(!showSalary)}
                >
                  {showSalary ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showSalary && (
                <p className="font-medium text-lg">
                  {formatCurrency(staff.salary)}
                </p>
              )}
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Today's Activity</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    On Duty Since:
                  </span>
                  <span className="font-medium">9:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Orders Handled:
                  </span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Revenue Generated:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(15400)}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-3">QR Badge</p>
              <Button className="w-full" variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Badge
              </Button>
              <div className="mt-3 p-4 border rounded-lg bg-muted flex items-center justify-center h-24">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    QR Badge Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddStaffDialog({ restaurantId, onAdded }: { restaurantId: string; onAdded: (member: StaffMember) => void }) {
  const showUpgrade = useUpgradeStore((s) => s.show);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    phone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({ fullName: '', role: '', phone: '', email: '' });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) { toast.error('Restaurant not found'); return; }

    setIsLoading(true);
    try {
      let avatar_url: string | null = null;
      if (avatarFile) {
        avatar_url = await uploadImage(avatarFile, 'avatars');
        if (!avatar_url) toast.error('Avatar upload failed — continuing without photo');
      }

      const result = await addStaff({
        restaurantId,
        name: formData.fullName,
        role: formData.role,
        phone: formData.phone,
        email: formData.email || undefined,
        avatarUrl: avatar_url,
      });

      if ('limitReached' in result && result.limitReached) { showUpgrade(result.limitReached); return; }
      if (result.error) { toast.error(result.error || 'Failed to add staff'); return; }

      const initials = formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      onAdded({
        id: Date.now(),
        name: formData.fullName,
        role: formData.role.toUpperCase(),
        phone: formData.phone,
        email: formData.email || '',
        status: 'Off Duty',
        joinedDate: new Date().toISOString().split('T')[0],
        salary: 0,
        avatar: initials,
        avatarUrl: avatar_url,
      });

      toast.success(`${formData.fullName} added successfully`);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error('Add staff error:', err);
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new staff member to your restaurant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <Input
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fullName: e.target.value,
                })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Role *
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="bartender">Bartender</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="cook">Cook</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="busser">Busser</SelectItem>
                <SelectItem value="housekeeper">Housekeeper</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number *
            </label>
            <Input
              placeholder="+977-9841234567"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Email (Optional)
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {formData.role === 'waiter' || formData.role === 'receptionist' ? (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
              After adding, create a login for this {formData.role} in the{' '}
              <strong>{formData.role === 'receptionist' ? 'Reception Logins' : 'Waiter Logins'}</strong> section below so they can sign in.
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium mb-2">
              Profile Photo (Optional)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover mb-2"
                />
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              {avatarPreview && (
                <p className="text-xs text-muted-foreground">Click to change</p>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpen(false); resetForm(); }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id || '';

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    getStaff(restaurantId).then((result) => {
      setIsLoading(false);
      setInitialized(true);
      if (result.error) { toast.error('Failed to load staff: ' + result.error); return; }
      if (result.data) {
        setStaffMembers(result.data.map((s: any) => {
          const role = s.role?.toUpperCase() || '';
          const firstName = s.firstName || '';
          return {
            id:         s.id,
            name:       firstName + ' ' + (s.lastName || ''),
            role,
            phone:      s.phoneNumber || '',
            email:      s.email || '',
            status:     s.status === 'ACTIVE' ? 'On Duty' : 'Off Duty',
            joinedDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            salary:     s.salary || 0,
            avatar:     (firstName.split(' ')[0]?.[0] || 'S').toUpperCase() + ((firstName.split(' ')[1]?.[0] || 'T').toUpperCase()),
            avatarUrl:  null,
          };
        }));
      }
    });
  }, [restaurantId]);

  const onDutyCount  = staffMembers.filter(s => s.status === 'On Duty').length;
  const waiterCount  = staffMembers.filter(s => s.role === 'WAITER').length;
  const kitchenCount = staffMembers.filter(s => s.role === 'KITCHEN').length;

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery);
    const matchesRole =
      selectedRole === 'all' ||
      staff.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const showTable = initialized && !isLoading;

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant staff and their roles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {staffMembers.length} Staff Members
            </Badge>
            <AddStaffDialog restaurantId={restaurantId} onAdded={member => setStaffMembers(prev => [member, ...prev])} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Staff
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              On Duty Today
            </CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {onDutyCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {staffMembers.length > 0 ? Math.round((onDutyCount / staffMembers.length) * 100) : 0}% of
              total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiters</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {waiterCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kitchen Staff
            </CardTitle>
            <div className="h-4 w-4 rounded-full bg-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {kitchenCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>
              Manage and view all staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="bartender">Bartender</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="cook">Cook</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="busser">Busser</SelectItem>
                  <SelectItem value="housekeeper">Housekeeper</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showTable ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px] whitespace-nowrap">Avatar</TableHead>
                  <TableHead className="w-[200px] whitespace-nowrap">Name</TableHead>
                  <TableHead className="w-[110px] whitespace-nowrap">Role</TableHead>
                  <TableHead className="w-[160px] whitespace-nowrap">Phone</TableHead>
                  <TableHead className="w-[110px] whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap">Joined</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedStaff(staff)}>
                      <TableCell className="whitespace-nowrap">
                        <StaffAvatar initials={staff.avatar} role={staff.role} />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap truncate">{staff.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={roleColors[staff.role]}>
                          {formatRole(staff.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{staff.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${staff.status === 'On Duty' ? 'bg-primary' : 'bg-muted-foreground'}`}
                          />
                          {staff.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(staff.joinedDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{staff.name}</strong>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={async () => {
                                    const res = await deleteStaff(String(staff.id));
                                    if (res.error) { toast.error(res.error); return; }
                                    setStaffMembers((prev) => prev.filter((s) => s.id !== staff.id));
                                    toast.success(`${staff.name} deleted`);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <p className="text-muted-foreground">
                        No staff members found
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm">Loading staff data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedStaff && (
        <StaffDetailDialog
          staff={selectedStaff}
          open={!!selectedStaff}
          onOpenChange={(open) => { if (!open) setSelectedStaff(null); }}
        />
      )}

      <StaffLoginsSection
        role="RECEPTIONIST"
        title="Reception Logins"
        description="Create and manage receptionist accounts"
        createFn={createReceptionLogin}
        listFn={getReceptionLogins}
        toggleFn={deactivateReceptionLogin}
        deleteFn={deleteReceptionLogin}
      />
      <StaffLoginsSection
        role="WAITER"
        title="Waiter Logins"
        description="Create and manage waiter accounts"
        createFn={createWaiterLogin}
        listFn={getWaiterLogins}
        toggleFn={deactivateWaiterLogin}
        deleteFn={deleteWaiterLogin}
      />
    </div>
  );
}

function StaffLoginsSection({
  role,
  title,
  description,
  createFn,
  listFn,
  toggleFn,
  deleteFn,
}: {
  role: string;
  title: string;
  description: string;
  createFn: (data: { firstName: string; lastName?: string; username: string; password: string; phoneNumber?: string }) => Promise<any>;
  listFn: () => Promise<any>;
  toggleFn: (id: string) => Promise<any>;
  deleteFn?: (id: string) => Promise<any>;
}) {
  const { user } = useAuthStore();
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", password: "", phoneNumber: "" });
  const [creating, setCreating] = useState(false);

  const fetchLogins = async () => {
    setLoading(true);
    const res = await listFn();
    if ("data" in res && res.data) setLogins(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchLogins(); }, []);

  const handleCreate = async () => {
    if (!form.firstName || !form.username || !form.password) {
      toast.error("First name, username, and password are required");
      return;
    }
    setCreating(true);
    const res = await createFn(form);
    setCreating(false);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success(`${title.slice(0, -1)} created`);
    setShowCreate(false);
    setForm({ firstName: "", lastName: "", username: "", password: "", phoneNumber: "" });
    fetchLogins();
  };

  const handleToggle = async (id: string) => {
    const res = await toggleFn(id);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("Login toggled");
    fetchLogins();
  };

  const isOwner = user?.role === "RESTAURANT_OWNER";

  const handleDelete = async (id: string) => {
    if (!deleteFn) return;
    const res = await deleteFn(id);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("Login deleted permanently");
    fetchLogins();
  };

  if (user?.role === role) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <UserPlus className="w-4 h-4 mr-1" /> New Login
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreate && (
          <div className="mb-4 p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="First name *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <Input placeholder="Gmail * (name@gmail.com)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <Input placeholder="Phone No (alternative login)" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              <Input type="password" placeholder="Password * (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" disabled={creating} onClick={handleCreate}>
                {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Create
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : logins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No {title.toLowerCase()} created yet.</p>
        ) : (
          <div className="space-y-2">
            {logins.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.firstName} {l.lastName}</span>
                    <span className="text-xs text-muted-foreground">@{l.username}</span>
                    {l.phoneNumber && <span className="text-xs text-muted-foreground">| {l.phoneNumber}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${l.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {l.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {l.lastLoginAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">Last login: {new Date(l.lastLoginAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(l.id)}>
                    {l.isActive ? <Lock className="w-3 h-3 text-destructive" /> : <Unlock className="w-3 h-3 text-success" />}
                  </Button>
                  {isOwner && deleteFn && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {title.slice(0, -1)} Login</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{l.firstName} {l.lastName}</strong>'s login (@{l.username}{l.phoneNumber ? ` | ${l.phoneNumber}` : ''}). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(l.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
