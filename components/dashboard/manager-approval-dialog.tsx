'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ManagerApprovalPayload {
  reason: string;
  approverUsername: string;
  approverPassword: string;
}

/**
 * Reusable "manager approval" gate — used anywhere a cashier/waiter needs a
 * manager/owner to authorize a destructive action (void bill, void order,
 * void item) with their own credentials rather than the acting staff's.
 */
export default function ManagerApprovalDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Approve & Void',
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (data: ManagerApprovalPayload) => Promise<{ error?: string } | void>;
}) {
  const [reason, setReason] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setReason('');
    setUsername('');
    setPassword('');
    setError('');
    setLoading(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    if (!username.trim() || !password) {
      setError('Manager or owner username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    const result = await onConfirm({
      reason: reason.trim(),
      approverUsername: username.trim(),
      approverPassword: password,
    });
    setLoading(false);
    if (result && 'error' in result && result.error) {
      setError(result.error);
      return;
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-warning" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="approval-reason">Reason</Label>
            <Textarea
              id="approval-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being voided?"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="approver-username">Manager / owner username</Label>
              <Input
                id="approver-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approver-password">Manager / owner password</Label>
              <Input
                id="approver-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
