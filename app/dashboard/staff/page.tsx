'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { formatDate, formatCurrency } from '@/lib/format';

// Mock data
const mockStaffMembers = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    role: 'Waiter',
    phone: '+977-9841234567',
    email: 'ramesh@resthru.com',
    status: 'On Duty',
    joinedDate: '2024-01-15',
    salary: 15000,
    avatar: 'RS',
  },
  {
    id: 2,
    name: 'Sita Thapa',
    role: 'Kitchen',
    phone: '+977-9842345678',
    email: 'sita@resthru.com',
    status: 'On Duty',
    joinedDate: '2024-02-20',
    salary: 18000,
    avatar: 'ST',
  },
  {
    id: 3,
    name: 'Binod Karki',
    role: 'Manager',
    phone: '+977-9843456789',
    email: 'binod@resthru.com',
    status: 'On Duty',
    joinedDate: '2023-12-01',
    salary: 25000,
    avatar: 'BK',
  },
  {
    id: 4,
    name: 'Anita Gurung',
    role: 'Cashier',
    phone: '+977-9844567890',
    email: 'anita@resthru.com',
    status: 'Off Duty',
    joinedDate: '2024-03-10',
    salary: 14000,
    avatar: 'AG',
  },
  {
    id: 5,
    name: 'Deepak Poudel',
    role: 'Waiter',
    phone: '+977-9845678901',
    email: 'deepak@resthru.com',
    status: 'On Duty',
    joinedDate: '2024-01-25',
    salary: 15000,
    avatar: 'DP',
  },
  {
    id: 6,
    name: 'Priya Sharma',
    role: 'Kitchen',
    phone: '+977-9846789012',
    email: 'priya@resthru.com',
    status: 'On Duty',
    joinedDate: '2024-02-15',
    salary: 17000,
    avatar: 'PS',
  },
  {
    id: 7,
    name: 'Suresh Yadav',
    role: 'Waiter',
    phone: '+977-9847890123',
    email: 'suresh@resthru.com',
    status: 'Off Duty',
    joinedDate: '2024-01-30',
    salary: 15000,
    avatar: 'SY',
  },
  {
    id: 8,
    name: 'Mina Tamang',
    role: 'Kitchen',
    phone: '+977-9848901234',
    email: 'mina@resthru.com',
    status: 'On Duty',
    joinedDate: '2024-03-05',
    salary: 16000,
    avatar: 'MT',
  },
];

const roleColors: { [key: string]: string } = {
  Waiter: 'bg-primary-light text-primary',
  Kitchen:
    'bg-accent-light text-warning',
  Cashier:
    'bg-primary-light text-primary',
  Manager:
    'bg-primary-light text-primary',
};

const avatarBgColors: { [key: string]: string } = {
  Waiter: 'bg-primary',
  Kitchen: 'bg-accent',
  Cashier: 'bg-primary',
  Manager: 'bg-primary',
};

interface StaffMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  joinedDate: string;
  salary: number;
  avatar: string;
}

function StaffAvatar({
  initials,
  role,
}: {
  initials: string;
  role: string;
}) {
  return (
    <div
      className={`${avatarBgColors[role] || 'bg-muted0'} h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
    >
      {initials}
    </div>
  );
}

function StaffDetailDialog({ staff }: { staff: StaffMember }) {
  const [showSalary, setShowSalary] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-muted/50">
          <TableCell>
            <StaffAvatar initials={staff.avatar} role={staff.role} />
          </TableCell>
          <TableCell className="font-medium">{staff.name}</TableCell>
          <TableCell>
            <Badge className={roleColors[staff.role]}>
              {staff.role}
            </Badge>
          </TableCell>
          <TableCell className="text-sm">{staff.phone}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${staff.status === 'On Duty' ? 'bg-primary' : 'bg-muted-foreground'}`}
              />
              {staff.status}
            </div>
          </TableCell>
          <TableCell className="text-sm">
            {formatDate(staff.joinedDate)}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                <QrCode className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                {staff.status === 'On Duty' ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className={`${avatarBgColors[staff.role] || 'bg-muted0'} h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl`}
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
                {staff.role}
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

function AddStaffDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setIsOpen(false);
    setFormData({
      fullName: '',
      role: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
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
                <SelectItem value="kitchen">Kitchen</SelectItem>
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
          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Profile Photo (Optional)
            </label>
            <label className="flex items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary">
              Add Staff
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const onDutyCount = mockStaffMembers.filter(
    (s) => s.status === 'On Duty'
  ).length;
  const waiterCount = mockStaffMembers.filter(
    (s) => s.role === 'Waiter'
  ).length;
  const kitchenCount = mockStaffMembers.filter(
    (s) => s.role === 'Kitchen'
  ).length;

  const filteredStaff = mockStaffMembers.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery);
    const matchesRole =
      selectedRole === 'all' ||
      staff.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant staff and their roles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {mockStaffMembers.length} Staff Members
            </Badge>
            <AddStaffDialog />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Staff
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStaffMembers.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
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
                {Math.round((onDutyCount / mockStaffMembers.length) * 100)}% of
                total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
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
        </motion.div>

        <motion.div variants={itemVariants}>
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
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
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
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <StaffDetailDialog
                        key={staff.id}
                        staff={staff}
                      />
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
