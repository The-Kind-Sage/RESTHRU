'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Menu as MenuIcon,
  X,
  LayoutGrid,
  BookOpen,
  User,
  GlassWater,
  Bell,
  FileText,
  ChevronRight,
  List,
  Loader2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { requestTableService } from '@/lib/actions/public-order';
import { cn } from '@/lib/utils';

type ServiceKind = 'WATER' | 'WAITER';

/**
 * The guest's floating action button and help sheet.
 *
 * "Request water" / "Call waiter" ring reception through the same notification
 * pipeline as orders, so staff watch one place rather than a separate screen.
 * Requesting the bill is handed back to the page, which already owns that flow
 * (it needs the payment-method dialog).
 */
export default function GuestHelpPanel({
  restaurantId,
  tableId,
  onRequestBill,
  viewMode = 'list',
  onViewModeChange,
  categories = [],
  subMenus = [],
  selectedCategory = 'all',
  onSelectCategory,
}: {
  restaurantId: string;
  tableId: string;
  onRequestBill?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  categories?: { id: string; name: string }[];
  subMenus?: string[];
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
}) {
  const [fabOpen, setFabOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [pending, setPending] = useState<ServiceKind | null>(null);

  const sendRequest = async (kind: ServiceKind) => {
    if (pending) return;
    setPending(kind);
    const res = await requestTableService({ restaurantId, tableId, kind });
    setPending(null);

    if ('error' in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      kind === 'WATER' ? 'Water is on the way' : 'A waiter is coming over'
    );
    setHelpOpen(false);
  };

  const actions = [
    { label: 'View Style', Icon: LayoutGrid, onClick: () => setViewOpen(true) },
    { label: 'Explore Menu', Icon: BookOpen, onClick: () => setExploreOpen(true) },
    { label: 'Profile', Icon: User, onClick: () => setHelpOpen(true) },
  ];

  return (
    <>
      {/* ── Floating action button ── */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
        {fabOpen &&
          actions.map(({ label, Icon, onClick }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium shadow-md">
                {label}
              </span>
              <button
                onClick={() => {
                  setFabOpen(false);
                  onClick?.();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-md transition-transform active:scale-95"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </button>
            </div>
          ))}

        <button
          onClick={() => setFabOpen((o) => !o)}
          aria-label={fabOpen ? 'Close menu' : 'Open menu'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
        >
          {fabOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Help sheet ── */}
      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 overflow-y-auto">
          <SheetHeader className="px-5 pt-6 pb-4 text-left">
            <p className="text-lg font-semibold">HELLO 👋</p>
            <SheetTitle className="text-2xl font-bold">
              What can we help with?
            </SheetTitle>
          </SheetHeader>

          {/* Sign-in nudge */}
          <div className="mx-5 flex items-center gap-3 rounded-xl bg-muted/50 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Sign in to your account</p>
              <p className="text-sm text-muted-foreground">Better experience ahead</p>
            </div>
            <Button
              size="sm"
              className="flex-shrink-0"
              onClick={() => toast.info('Guest accounts are coming soon.')}
            >
              Log in
            </Button>
          </div>

          <p className="px-5 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Need something?
          </p>

          <div className="px-5 pb-8 space-y-2">
            <ServiceRow
              Icon={GlassWater}
              label="Request Water"
              loading={pending === 'WATER'}
              onClick={() => sendRequest('WATER')}
            />
            <ServiceRow
              Icon={Bell}
              label="Call Waiter"
              loading={pending === 'WAITER'}
              onClick={() => sendRequest('WAITER')}
            />
            <ServiceRow
              Icon={FileText}
              label="Request Bill"
              onClick={() => {
                setHelpOpen(false);
                onRequestBill?.();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      {/* ── View style ── */}
      <Sheet open={viewOpen} onOpenChange={setViewOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>View Style</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {([
              { key: 'list', label: 'List', Icon: List },
              { key: 'grid', label: 'Grid', Icon: LayoutGrid },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => {
                  onViewModeChange?.(key);
                  setViewOpen(false);
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 py-6 transition-colors',
                  viewMode === key
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Explore menu: jump to a category or sub-menu ── */}
      <Sheet open={exploreOpen} onOpenChange={setExploreOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Explore Menu</SheetTitle>
          </SheetHeader>

          <p className="pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <div className="space-y-1">
            <ExploreRow
              label="All items"
              active={selectedCategory === 'all'}
              onClick={() => {
                onSelectCategory?.('all');
                setExploreOpen(false);
              }}
            />
            {categories.map((c) => (
              <ExploreRow
                key={c.id}
                label={c.name}
                active={selectedCategory === c.id}
                onClick={() => {
                  onSelectCategory?.(c.id);
                  setExploreOpen(false);
                }}
              />
            ))}
          </div>

          {subMenus.length > 0 && (
            <>
              <p className="pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sub Menu
              </p>
              <div className="space-y-1 pb-8">
                {subMenus.map((name) => (
                  <ExploreRow
                    key={name}
                    label={name}
                    onClick={() => {
                      // Sub-menus are a label on the dish, not a filterable list
                      // of their own yet — scroll to the section instead.
                      setExploreOpen(false);
                      document
                        .getElementById(`section-${name}`)
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ExploreRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors',
        active ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'
      )}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  );
}

function ServiceRow({
  Icon,
  label,
  onClick,
  loading,
}: {
  Icon: React.ElementType;
  label: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl bg-muted/50 px-4 py-3.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  );
}
