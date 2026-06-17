'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  AlertTriangle,
  ArrowUpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/format';

// Mock restaurant data
const restaurantDetailsMock = {
  id: 1,
  name: 'Himalayan Kitchen',
  city: 'Kathmandu',
  owner: {
    name: 'Ramesh Poudel',
    email: 'ramesh@himalayankitchen.com',
    phone: '+977-1-4123456',
  },
  address: 'Thamel, Kathmandu',
  joinedDate: '2024-01-15',
  coverImage: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800',
  logoImage: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200',
  plan: 'Pro',
  status: 'Active',
  tables: {
    used: 12,
    total: 50,
  },
  staff: {
    used: 8,
    total: -1, // unlimited
  },
  ordersThisMonth: 342,
  storage: {
    used: 2.1,
    total: 10,
  },
  monthlyRevenue: 125000,
  platformCut: 12500,
};

const activityLogMock = [
  {
    id: 1,
    type: 'order',
    description: 'New order received',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'login',
    description: 'Owner logged in',
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'plan',
    description: 'Plan upgraded to Pro',
    time: '1 day ago',
  },
  {
    id: 4,
    type: 'order',
    description: 'Bulk order received',
    time: '2 days ago',
  },
  {
    id: 5,
    type: 'settings',
    description: 'Restaurant settings updated',
    time: '3 days ago',
  },
];

const planOptions = ['Free', 'Basic', 'Pro', 'Enterprise'];

export default function RestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const restaurant = restaurantDetailsMock;

  const [isSuspended, setIsSuspended] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(restaurant.plan);

  const handleToggleSuspend = () => {
    setIsSuspended(!isSuspended);
  };

  const handleUpgradePlan = () => {
    setShowUpgradeDialog(false);
  };

  const handleSendMessage = () => {
    console.log('Sending message:', messageText);
    setMessageText('');
    setShowMessageDialog(false);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Pro':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Basic':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Suspended':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="text-slate-400 hover:text-slate-200 -ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Restaurants
      </Button>

      {/* Restaurant Profile Card */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-purple-600 to-purple-800 relative overflow-hidden">
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-50"
          />
        </div>

        <CardContent className="pt-0">
          <div className="flex items-end gap-6 -mt-16 mb-6">
            {/* Logo */}
            <div className="h-32 w-32 rounded-lg border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={restaurant.logoImage}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Restaurant Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-100">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <Badge
                  className={`border ${getPlanBadgeColor(restaurant.plan)}`}
                >
                  {restaurant.plan}
                </Badge>
                <Badge
                  className={`border ${getStatusBadgeColor(
                    isSuspended ? 'Suspended' : restaurant.status
                  )}`}
                >
                  {isSuspended ? 'Suspended' : restaurant.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Owner Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">Name:</span>
                  <span className="text-slate-100 font-medium">
                    {restaurant.owner.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">
                    {restaurant.owner.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">
                    {restaurant.owner.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Location & Dates
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-100 font-medium">
                      {restaurant.address}
                    </p>
                    <p className="text-slate-400 text-sm">{restaurant.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">
                    Joined {formatDate(restaurant.joinedDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan & Usage Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Plan & Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Metrics */}
          <div className="space-y-4">
            {/* Tables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Tables
                </span>
                <span className="text-sm text-slate-400">
                  {restaurant.tables.used} / {restaurant.tables.total}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${
                      (restaurant.tables.used / restaurant.tables.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Staff */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Staff
                </span>
                <span className="text-sm text-slate-400">
                  {restaurant.staff.used}
                  {restaurant.staff.total === -1 ? ' / unlimited' : ' / ' + restaurant.staff.total}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full w-1/3" />
              </div>
            </div>

            {/* Orders This Month */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Orders This Month
                </span>
                <span className="text-sm text-slate-100 font-semibold">
                  {restaurant.ordersThisMonth}
                </span>
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Storage
                </span>
                <span className="text-sm text-slate-400">
                  {restaurant.storage.used}GB / {restaurant.storage.total}GB
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${
                      (restaurant.storage.used / restaurant.storage.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="border-t border-slate-800 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">
                  Monthly Revenue (Gross)
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(restaurant.monthlyRevenue)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Platform's Cut (10%)</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(restaurant.platformCut)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLogMock.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-slate-800 last:border-b-0"
              >
                <div className="h-8 w-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* View as Owner */}
            <Button
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              View as Owner
            </Button>

            {/* Send Message */}
            <Button
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              onClick={() => setShowMessageDialog(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            {/* Force Upgrade Plan */}
            <Button
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              onClick={() => setShowUpgradeDialog(true)}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Force Upgrade Plan
            </Button>

            {/* Suspend Toggle */}
            <Button
              variant={isSuspended ? 'default' : 'outline'}
              className={
                isSuspended
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'border-red-500/50 text-red-400 hover:bg-red-500/10'
              }
              onClick={handleToggleSuspend}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isSuspended ? 'Unsuspend' : 'Suspend'} Restaurant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Upgrade Plan</DialogTitle>
            <DialogDescription className="text-slate-400">
              Force {restaurant.name} to upgrade to a higher tier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">
                Select New Plan
              </label>
              <div className="space-y-2">
                {planOptions.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      selectedPlan === plan
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-100">{plan}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgradePlan}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Send Message</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send a message to {restaurant.owner.name} at {restaurant.name}.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!messageText.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
