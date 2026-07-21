'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Users, Search, RefreshCw, Loader2, ShieldCheck, ShieldAlert, KeyRound,
  Upload, ExternalLink, BadgeCheck, Ban, IdCard, UserCog, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/upload';
import {
  listOwners, getOwnerDetail, updateOwnerProfile, updateOwnerIdentity,
  setOwnerVerified, setOwnerPassword, setOwnerActive, updateOwnerNotes,
  type OwnerListItem, type OwnerDetail,
} from '@/lib/actions/admin-owners';

const DOC_TYPES = [
  { value: 'CITIZENSHIP', label: 'Citizenship' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PAN', label: 'PAN Card' },
];
const docLabel = (v: string) => DOC_TYPES.find((d) => d.value === v)?.label ?? v;

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'O';
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OwnersClient({ initialOwners }: { initialOwners: OwnerListItem[] }) {
  const [owners, setOwners] = useState(initialOwners);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const rows = await listOwners(q ?? search);
      setOwners(rows);
    } catch {
      toast.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const onSearchChange = (val: string) => {
    setSearch(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => reload(val), 300);
  };

  const stats = useMemo(() => ({
    total: owners.length,
    verified: owners.filter((o) => o.isVerified).length,
    unverified: owners.filter((o) => !o.isVerified).length,
    inactive: owners.filter((o) => !o.isActive).length,
  }), [owners]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Owner Management"
        description="Manage every restaurant owner — profile, identity documents & KYC, login access, and passwords."
      >
        <Button variant="outline" size="sm" onClick={() => reload()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total owners" value={stats.total} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard label="Verified" value={stats.verified} icon={<ShieldCheck className="h-4 w-4 text-success" />} tone="text-success" />
        <StatCard label="Unverified" value={stats.unverified} icon={<ShieldAlert className="h-4 w-4 text-warning" />} tone="text-warning" />
        <StatCard label="Deactivated" value={stats.inactive} icon={<Ban className="h-4 w-4 text-destructive" />} tone="text-destructive" />
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, email, phone, or restaurant"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          {loading && owners.length === 0 ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : owners.length === 0 ? (
            <EmptyState icon={Users} title="No owners found" description="Restaurant owners will appear here once they register." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="text-right">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setSelectedId(o.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {o.profileImage && <AvatarImage src={o.profileImage} alt="" />}
                            <AvatarFallback className="text-xs">{initials(o.firstName, o.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{o.firstName} {o.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{o.email || o.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.restaurant ? o.restaurant.name : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {o.isVerified ? (
                          <Badge className="border bg-success/10 text-success border-success/30 gap-1"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
                        ) : (
                          <Badge className="border bg-warning/10 text-warning border-warning/30">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${o.isActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                          {o.isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(o.lastLoginAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => setSelectedId(o.id)}>
                          <UserCog className="h-4 w-4 mr-1" /> Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OwnerSheet
        ownerId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => reload()}
      />
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${tone ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

// ── Management drawer ────────────────────────────────────────────────────────
function OwnerSheet({ ownerId, onClose, onChanged }: { ownerId: string | null; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<OwnerDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable state
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '', address: '', profileImage: '' as string | null });
  const [identity, setIdentity] = useState({ identityDocType: '', identityDocNumber: '', identityDocImage: '' as string | null, identityDocBackImage: '' as string | null });
  const [notes, setNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [busyToggle, setBusyToggle] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setDetail(null);
    const res = await getOwnerDetail(id);
    setLoading(false);
    if ('error' in res) { toast.error(res.error); return; }
    const d = res.data;
    setDetail(d);
    setProfile({
      firstName: d.firstName, lastName: d.lastName, email: d.email,
      phoneNumber: d.phoneNumber ?? '', dateOfBirth: d.dateOfBirth ?? '',
      address: d.address ?? '', profileImage: d.profileImage,
    });
    setIdentity({
      identityDocType: d.identityDocType, identityDocNumber: d.identityDocNumber ?? '',
      identityDocImage: d.identityDocImage, identityDocBackImage: d.identityDocBackImage,
    });
    setNotes(d.adminNotes ?? '');
    setNewPassword('');
  }, []);

  useEffect(() => {
    if (ownerId) load(ownerId);
  }, [ownerId, load]);

  const refreshBoth = async () => {
    if (ownerId) await load(ownerId);
    onChanged();
  };

  const doUpload = async (file: File, target: 'profileImage' | 'identityDocImage' | 'identityDocBackImage') => {
    setUploading(target);
    const url = await uploadImage(file, `owner-${target}`);
    setUploading(null);
    if (!url) { toast.error('Image upload failed'); return; }
    if (target === 'profileImage') setProfile((p) => ({ ...p, profileImage: url }));
    else setIdentity((i) => ({ ...i, [target]: url }));
    toast.success('Image uploaded — remember to save');
  };

  const saveProfile = async () => {
    if (!detail) return;
    if (!profile.firstName.trim()) return toast.error('First name is required');
    if (!profile.email.trim()) return toast.error('Email is required');
    setSavingProfile(true);
    const res = await updateOwnerProfile(detail.id, {
      firstName: profile.firstName, lastName: profile.lastName, email: profile.email,
      phoneNumber: profile.phoneNumber, dateOfBirth: profile.dateOfBirth || null,
      address: profile.address, profileImage: profile.profileImage,
    });
    setSavingProfile(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success('Profile saved');
    refreshBoth();
  };

  const saveIdentity = async () => {
    if (!detail) return;
    setSavingIdentity(true);
    const res = await updateOwnerIdentity(detail.id, {
      identityDocType: identity.identityDocType, identityDocNumber: identity.identityDocNumber,
      identityDocImage: identity.identityDocImage, identityDocBackImage: identity.identityDocBackImage,
    });
    setSavingIdentity(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success('Identity documents saved');
    refreshBoth();
  };

  const saveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    const res = await updateOwnerNotes(detail.id, notes);
    setSavingNotes(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success('Notes saved');
  };

  const savePassword = async () => {
    if (!detail) return;
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPassword(true);
    const res = await setOwnerPassword(detail.id, newPassword);
    setSavingPassword(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success('Owner password set — share it securely');
    setNewPassword('');
  };

  const toggleVerified = async (next: boolean) => {
    if (!detail) return;
    setBusyToggle(true);
    const res = await setOwnerVerified(detail.id, next);
    setBusyToggle(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success(next ? 'Owner marked as verified' : 'Verification revoked');
    refreshBoth();
  };

  const toggleActive = async (next: boolean) => {
    if (!detail) return;
    setBusyToggle(true);
    const res = await setOwnerActive(detail.id, next);
    setBusyToggle(false);
    if ('error' in res && res.error) return toast.error(res.error);
    toast.success(next ? 'Owner login reactivated' : 'Owner login deactivated');
    refreshBoth();
  };

  return (
    <Sheet open={!!ownerId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {loading || !detail ? (
          <div className="flex h-full items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            {/* Header */}
            <SheetHeader className="space-y-0 border-b p-5 text-left">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  {detail.profileImage && <AvatarImage src={detail.profileImage} alt="" />}
                  <AvatarFallback>{initials(detail.firstName, detail.lastName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{detail.firstName} {detail.lastName}</SheetTitle>
                  <SheetDescription className="truncate">{detail.email}</SheetDescription>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {detail.isVerified
                      ? <Badge className="border bg-success/10 text-success border-success/30 gap-1 text-[10px]"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
                      : <Badge className="border bg-warning/10 text-warning border-warning/30 text-[10px]">Unverified</Badge>}
                    <Badge className={`border text-[10px] ${detail.isActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                      {detail.isActive ? 'Active login' : 'Deactivated'}
                    </Badge>
                    {detail.restaurant && (
                      <Link href={`/superadmin/restaurants/${detail.restaurant.id}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                        <Building2 className="h-3 w-3" /> {detail.restaurant.name} <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              {/* Quick toggles */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-xs font-medium">KYC verified</span>
                  <Switch checked={detail.isVerified} disabled={busyToggle} onCheckedChange={toggleVerified} />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-xs font-medium">Login enabled</span>
                  <Switch checked={detail.isActive} disabled={busyToggle} onCheckedChange={toggleActive} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Joined {fmtDate(detail.createdAt)} · Last login {fmtDate(detail.lastLoginAt)}
                {detail.verifiedAt ? ` · Verified ${fmtDate(detail.verifiedAt)}` : ''}
              </p>
            </SheetHeader>

            <Tabs defaultValue="profile" className="p-5">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="text-xs gap-1"><UserCog className="h-3.5 w-3.5" /> Profile</TabsTrigger>
                <TabsTrigger value="identity" className="text-xs gap-1"><IdCard className="h-3.5 w-3.5" /> Identity</TabsTrigger>
                <TabsTrigger value="security" className="text-xs gap-1"><KeyRound className="h-3.5 w-3.5" /> Security</TabsTrigger>
              </TabsList>

              {/* Profile */}
              <TabsContent value="profile" className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    {profile.profileImage && <AvatarImage src={profile.profileImage} alt="" />}
                    <AvatarFallback>{initials(profile.firstName, profile.lastName)}</AvatarFallback>
                  </Avatar>
                  <UploadButton label="Change photo" busy={uploading === 'profileImage'} onFile={(f) => doUpload(f, 'profileImage')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name"><Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></Field>
                  <Field label="Last name"><Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></Field>
                </div>
                <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone"><Input value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} placeholder="98XXXXXXXX" /></Field>
                  <Field label="Date of birth"><Input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} /></Field>
                </div>
                <Field label="Address"><Textarea rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Street, city" /></Field>
                <Field label="Admin notes (internal)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes about this owner" /></Field>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={saveNotes} disabled={savingNotes}>
                    {savingNotes && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save notes
                  </Button>
                  <Button size="sm" onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save profile
                  </Button>
                </div>
              </TabsContent>

              {/* Identity & KYC */}
              <TabsContent value="identity" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Document type">
                    <Select value={identity.identityDocType || 'NONE'} onValueChange={(v) => setIdentity({ ...identity, identityDocType: v === 'NONE' ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Not set</SelectItem>
                        {DOC_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Document number"><Input value={identity.identityDocNumber} onChange={(e) => setIdentity({ ...identity, identityDocNumber: e.target.value })} placeholder="e.g. 12-34-56789" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DocImage label="Front" url={identity.identityDocImage} busy={uploading === 'identityDocImage'} onFile={(f) => doUpload(f, 'identityDocImage')} onClear={() => setIdentity({ ...identity, identityDocImage: null })} />
                  <DocImage label="Back" url={identity.identityDocBackImage} busy={uploading === 'identityDocBackImage'} onFile={(f) => doUpload(f, 'identityDocBackImage')} onClear={() => setIdentity({ ...identity, identityDocBackImage: null })} />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {detail.isVerified
                    ? <span className="text-success">This owner's identity is verified{detail.verifiedAt ? ` (${fmtDate(detail.verifiedAt)})` : ''}.</span>
                    : 'Not yet verified. Review the documents, then flip “KYC verified” at the top.'}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveIdentity} disabled={savingIdentity}>
                    {savingIdentity && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save documents
                  </Button>
                </div>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security" className="space-y-4 pt-4">
                <Field label="Set a new login password">
                  <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Immediately replaces the owner's password. Share the new password with them through a secure channel.
                </p>
                <div className="flex justify-end">
                  <Button size="sm" onClick={savePassword} disabled={savingPassword || newPassword.length < 6}>
                    {savingPassword ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />} Set password
                  </Button>
                </div>

                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/[0.03] p-3">
                  <p className="text-xs font-medium text-foreground">Login access</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {detail.isActive
                      ? 'Deactivating blocks this owner from signing in (their staff are unaffected).'
                      : 'This owner is currently blocked from signing in.'}
                  </p>
                  <Button
                    variant={detail.isActive ? 'outline' : 'default'}
                    size="sm"
                    disabled={busyToggle}
                    onClick={() => toggleActive(!detail.isActive)}
                    className={`mt-2 ${detail.isActive ? 'text-destructive hover:text-destructive' : ''}`}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    {detail.isActive ? 'Deactivate login' : 'Reactivate login'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function UploadButton({ label, busy, onFile }: { label: string; busy: boolean; onFile: (f: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted/50">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      {busy ? 'Uploading…' : label}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}

function DocImage({ label, url, busy, onFile, onClear }: { label: string; url: string | null; busy: boolean; onFile: (f: File) => void; onClear: () => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <label className="group relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${label} document`} className="h-full w-full object-cover" />
        ) : busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground"><Upload className="h-4 w-4" /> Upload</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </label>
      {url && (
        <div className="flex items-center justify-between">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">View full</a>
          <button type="button" onClick={onClear} className="text-[11px] text-destructive hover:underline">Remove</button>
        </div>
      )}
    </div>
  );
}
