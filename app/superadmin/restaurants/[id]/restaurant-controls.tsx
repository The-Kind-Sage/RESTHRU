'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CreditCard, ToggleRight, UserCog, KeyRound, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getPlans } from '@/lib/actions/plans';
import {
  setRestaurantPlan,
  updateRestaurantFeatures,
  resetRestaurantOwnerPassword,
  setRestaurantOwnerActive,
} from '@/lib/actions/admin';

type Plan = { id: string; name: string; type: string; monthlyPrice: number };

type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isActive: boolean;
} | null;

export function RestaurantControls({
  restaurantId,
  restaurantName,
  currentPlanId,
  currentPlanName,
  initialFeatures,
  owner,
}: {
  restaurantId: string;
  restaurantName: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
  initialFeatures: { enableQRMenu: boolean; enableGST: boolean };
  owner: Owner;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId ?? '');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Features
  const [features, setFeatures] = useState(initialFeatures);

  // Owner
  const [newPassword, setNewPassword] = useState('');
  const [ownerActive, setOwnerActive] = useState(owner?.isActive ?? false);

  useEffect(() => {
    getPlans().then((res) => {
      if (res.data) setPlans(res.data as Plan[]);
    });
  }, []);

  const savePlan = () => {
    if (!selectedPlanId) {
      toast.error('Select a plan first');
      return;
    }
    startTransition(async () => {
      const res = await setRestaurantPlan(restaurantId, selectedPlanId, billingCycle);
      if (res.error) return toast.error(res.error);
      toast.success(`${restaurantName} moved to the ${res.data?.planName} plan`);
      router.refresh();
    });
  };

  const toggleFeature = (key: 'enableQRMenu' | 'enableGST', value: boolean) => {
    const previous = features[key];
    setFeatures((f) => ({ ...f, [key]: value }));
    startTransition(async () => {
      const res = await updateRestaurantFeatures(restaurantId, { [key]: value });
      if (res.error) {
        setFeatures((f) => ({ ...f, [key]: previous })); // revert on failure
        return toast.error(res.error);
      }
      toast.success('Feature updated');
    });
  };

  const resetPassword = () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    startTransition(async () => {
      const res = await resetRestaurantOwnerPassword(restaurantId, newPassword);
      if (res.error) return toast.error(res.error);
      toast.success('Owner password reset');
      setNewPassword('');
    });
  };

  const toggleOwnerActive = () => {
    const next = !ownerActive;
    startTransition(async () => {
      const res = await setRestaurantOwnerActive(restaurantId, next);
      if (res.error) return toast.error(res.error);
      setOwnerActive(next);
      toast.success(next ? 'Owner login reactivated' : 'Owner login deactivated — they can no longer sign in');
    });
  };

  return (
    <div className="space-y-6">
      {/* Subscription plan */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Subscription Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Current plan:{' '}
            <span className="font-medium text-foreground">{currentPlanName ?? 'None'}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.monthlyPrice > 0 ? ` — NPR ${p.monthlyPrice.toLocaleString()}/mo` : ' — Free'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Billing</Label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'MONTHLY' | 'ANNUAL')}>
                <SelectTrigger className="h-9 text-sm w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={savePlan} disabled={isPending} className="h-9">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature flags */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ToggleRight className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">QR Menu</p>
              <p className="text-xs text-muted-foreground">Let guests scan a table QR to view the menu.</p>
            </div>
            <Switch
              checked={features.enableQRMenu}
              disabled={isPending}
              onCheckedChange={(v) => toggleFeature('enableQRMenu', v)}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">GST / Tax on bills</p>
              <p className="text-xs text-muted-foreground">Apply GST to this restaurant's bills.</p>
            </div>
            <Switch
              checked={features.enableGST}
              disabled={isPending}
              onCheckedChange={(v) => toggleFeature('enableGST', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Owner account */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Owner Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!owner ? (
            <p className="text-sm text-muted-foreground">This restaurant has no owner account.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {owner.firstName} {owner.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{owner.email || owner.username}</p>
                </div>
                <Badge
                  className={`border text-[10px] ${ownerActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}
                >
                  {ownerActive ? 'Active' : 'Deactivated'}
                </Badge>
              </div>

              <div className="border-t border-border pt-4 space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Reset password
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="h-9 text-sm"
                  />
                  <Button variant="outline" onClick={resetPassword} disabled={isPending} className="h-9 shrink-0">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Sets a new login password for the owner immediately. Share it with them securely.
                </p>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ownerActive ? 'Deactivate owner login' : 'Reactivate owner login'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ownerActive
                      ? 'Blocks the owner from signing in (receptionists and waiters are unaffected).'
                      : 'Restores the owner’s ability to sign in.'}
                  </p>
                </div>
                <Button
                  variant={ownerActive ? 'outline' : 'default'}
                  onClick={toggleOwnerActive}
                  disabled={isPending}
                  className={`h-9 shrink-0 ${ownerActive ? 'text-destructive hover:text-destructive' : ''}`}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                  {ownerActive ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
