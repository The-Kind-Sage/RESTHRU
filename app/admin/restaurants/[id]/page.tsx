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
        return 'bg-accent/20 text-accent border-accent/30';
      case 'Pro':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'Basic':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted0/20 text-muted-foreground border-border/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'Suspended':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted0/20 text-muted-foreground border-border/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-muted-foreground -ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Restaurants
      </Button>

      {/* Restaurant Profile Card */}
      <Card className="bg-primary border-border overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary to-primary-hover relative overflow-hidden">
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-50"
          />
        </div>

        <CardContent className="pt-0">
          <div className="flex items-end gap-6 -mt-16 mb-6">
            {/* Logo */}
            <div className="h-32 w-32 rounded-lg border-4 border-border bg-primary-hover flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={restaurant.logoImage}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Restaurant Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-border">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                Owner Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">Name:</span>
                  <span className="text-foreground font-medium">
                    {restaurant.owner.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">
                    {restaurant.owner.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">
                    {restaurant.owner.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                Location & Dates
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">
                      {restaurant.address}
                    </p>
                    <p className="text-muted-foreground text-sm">{restaurant.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">
                    Joined {formatDate(restaurant.joinedDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan & Usage Card */}
      <Card className="bg-primary border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Plan & Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Metrics */}
          <div className="space-y-4">
            {/* Tables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Tables
                </span>
                <span className="text-sm text-muted-foreground">
                  {restaurant.tables.used} / {restaurant.tables.total}
                </span>
              </div>
              <div className="w-full bg-primary-hover rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
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
                <span className="text-sm font-medium text-muted-foreground">
                  Staff
                </span>
                <span className="text-sm text-muted-foreground">
                  {restaurant.staff.used}
                  {restaurant.staff.total === -1 ? ' / unlimited' : ' / ' + restaurant.staff.total}
                </span>
              </div>
              <div className="w-full bg-primary-hover rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-1/3" />
              </div>
            </div>

            {/* Orders This Month */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Orders This Month
                </span>
                <span className="text-sm text-foreground font-semibold">
                  {restaurant.ordersThisMonth}
                </span>
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Storage
                </span>
                <span className="text-sm text-muted-foreground">
                  {restaurant.storage.used}GB / {restaurant.storage.total}GB
                </span>
              </div>
              <div className="w-full bg-primary-hover rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
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
          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary-hover/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Monthly Revenue (Gross)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(restaurant.monthlyRevenue)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary-hover/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Platform's Cut (10%)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(restaurant.platformCut)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="bg-primary border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLogMock.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="bg-primary border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* View as Owner */}
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary-hover/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              View as Owner
            </Button>

            {/* Send Message */}
            <Button
              variant="outline"
              className="border-info/50 text-info hover:bg-info/10"
              onClick={() => setShowMessageDialog(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            {/* Force Upgrade Plan */}
            <Button
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/10"
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
                  ? 'bg-destructive hover:bg-destructive'
                  : 'border-destructive/50 text-destructive hover:bg-destructive/10'
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
        <DialogContent className="bg-primary border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Upgrade Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Force {restaurant.name} to upgrade to a higher tier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Select New Plan
              </label>
              <div className="space-y-2">
                {planOptions.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      selectedPlan === plan
                        ? 'bg-primary/20 border-primary/50'
                        : 'bg-primary-hover/50 border-border hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{plan}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgradePlan}
              className="bg-primary hover:bg-primary-hover"
            >
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-primary border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Send Message</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message to {restaurant.owner.name} at {restaurant.name}.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-32 bg-primary-hover border border-border rounded-lg px-4 py-3 text-foreground placeholder-slate-500 focus:outline-none focus:border-primary"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary-hover"
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
