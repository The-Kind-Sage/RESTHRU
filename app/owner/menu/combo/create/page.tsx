"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RemoveFormatting,
  Eye,
  MoreVertical,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories, getMenuItems } from "@/lib/actions/menu";
import { createCombo } from "@/lib/actions/combos";
import { getLibrary } from "@/lib/actions/image-library";
import SelectImageModal, { type LibraryImage } from "@/components/menu/SelectImageModal";
import { cn } from "@/lib/utils";

const SUB_MENUS = ["Appetizers", "Main Courses", "Desserts", "Beverages", "Extra"];
const COMBO_TYPES = ["Veg", "Non-Veg", "Mixed"];

type ComboItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  addons?: string;
  imageUrl?: string | null;
  foodType?: string;
};

export default function ComboOfferPage() {
  const router = useRouter();
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  // ── Form state ──
  const [comboName, setComboName] = useState("");
  const [subMenu, setSubMenu] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [actualPrice, setActualPrice] = useState(0);
  const [comboOfferPrice, setComboOfferPrice] = useState(0);
  const [comboType, setComboType] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [prepTime, setPrepTime] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [descHtml, setDescHtml] = useState("");
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Data ──
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [editItem, setEditItem] = useState<ComboItem | null>(null);
  const [itemQuery, setItemQuery] = useState("");
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const [catRes, itemsRes, libRes] = await Promise.all([
        getCategories(restaurantId),
        getMenuItems(restaurantId),
        getLibrary(),
      ]);
      if (catRes.data) setCategories(catRes.data.map((c: any) => ({ id: c.id, name: c.name })));
      if (itemsRes.data) setAllMenuItems(itemsRes.data);
      // Merge: persistent library + existing dish images (deduplicated by URL)
      const seen = new Set<string>();
      const lib: LibraryImage[] = [];
      for (const entry of libRes) {
        if (entry.url && !seen.has(entry.url)) {
          seen.add(entry.url);
          lib.push({ url: entry.url, name: entry.name });
        }
      }
      if (itemsRes.data) {
        for (const i of itemsRes.data as any[]) {
          if (i.imageUrl && !seen.has(i.imageUrl)) {
            seen.add(i.imageUrl);
            lib.push({ url: i.imageUrl, name: i.name });
          }
        }
      }
      setLibrary(lib);
    })();
  }, [restaurantId]);

  // ── Derived ──
  const autoActualPrice = comboItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const displayActualPrice = actualPrice || autoActualPrice;
  const comboInitials = (comboName.trim() || "CO").slice(0, 2).toUpperCase();
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  const filteredMenuItems = allMenuItems.filter((item: any) => {
    const q = itemQuery.toLowerCase();
    return (
      !comboItems.some((ci) => ci.id === item.id) &&
      (item.name.toLowerCase().includes(q) || (item.category?.name || "").toLowerCase().includes(q))
    );
  });

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    descRef.current?.focus();
    setDescHtml(descRef.current?.innerHTML ?? "");
  };

  const resetForm = useCallback(() => {
    setComboName("");
    setSubMenu("");
    setCategoryId("");
    setActualPrice(0);
    setComboOfferPrice(0);
    setComboType("");
    setHsCode("");
    setPrepTime(0);
    setImage(null);
    setComboItems([]);
    setDescHtml("");
    if (descRef.current) descRef.current.innerHTML = "";
  }, []);

  const addItems = (items: any[]) => {
    const newItems: ComboItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      quantity: 1,
      variant: item.sizeOptions?.[0]?.name || "",
      addons: "",
      imageUrl: item.imageUrl,
      foodType: item.foodType,
    }));
    setComboItems((prev) => [...prev, ...newItems]);
    setAddItemsOpen(false);
    setItemQuery("");
  };

  const updateItemQty = (id: string, delta: number) => {
    setComboItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setComboItems((prev) => prev.filter((item) => item.id !== id));
  };

  const save = async () => {
    if (!restaurantId) return toast.error("Restaurant not loaded");
    if (!comboName.trim()) return toast.error("Combo name is required");
    if (!subMenu) return toast.error("Sub-Menu is required");
    if (!categoryId) return toast.error("Category is required");
    if (comboItems.length === 0) return toast.error("Add at least one dish to the combo");
    if (!comboOfferPrice || comboOfferPrice <= 0) return toast.error("Combo offer price is required");

    setSaving(true);
    const res = await createCombo({
      restaurantId,
      name: comboName.trim(),
      menuSection: subMenu,
      categoryId,
      price: displayActualPrice,
      offerPrice: comboOfferPrice,
      comboType: comboType || null,
      hsCode: hsCode || null,
      prepTime: prepTime || 0,
      imageUrl: image,
      description: descHtml || null,
      items: comboItems,
    });
    setSaving(false);

    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Combo offer created");
    router.push("/owner/menu/combo");
  };

  return (
    <div className="pb-28">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/owner/menu/combo")}>
          <ChevronLeft className="h-4 w-4 text-primary" />
        </Button>
        <h1 className="text-2xl font-bold">Create Combo Offer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* ── Form ── */}
        <div className="space-y-6 max-w-3xl">
          {/* Combo Name */}
          <Field label="Combo Name" required>
            <Input value={comboName} onChange={(e) => setComboName(e.target.value)} placeholder="Enter Combo Name" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sub-Menu" required>
              <Select value={subMenu} onValueChange={setSubMenu}>
                <SelectTrigger><SelectValue placeholder="Select Sub-Menu" /></SelectTrigger>
                <SelectContent>
                  {SUB_MENUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category" required>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No categories — add one first</div>
                  ) : (
                    categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Selected Combo Dishes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Selected Combo Dishes</span>
                <p className="text-xs text-muted-foreground">{comboItems.length} item{comboItems.length !== 1 ? "s" : ""} selected</p>
              </div>
            </div>

            {comboItems.length > 0 && (
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-4 py-2.5 font-semibold">Dish Name</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Quantity</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Unit Price</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Variant</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Add-ons</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Subtotal</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comboItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQty(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQty(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">Rs {item.price}</td>
                        <td className="px-4 py-2.5">
                          {item.variant ? (
                            <Badge variant="outline" className="text-xs font-normal">{item.variant}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.addons || "—"}</td>
                        <td className="px-4 py-2.5 font-medium">Rs {item.price * item.quantity}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setAddItemsOpen(true)}>
              <Plus className="h-4 w-4" /> Add Items
            </Button>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Actual Price" required>
              <PriceInput value={actualPrice || autoActualPrice} onChange={setActualPrice} />
            </Field>
            <Field label="Combo Offer Price" required>
              <PriceInput value={comboOfferPrice} onChange={setComboOfferPrice} />
            </Field>
          </div>

          {/* Combo Dish Image */}
          <Section title="Combo Dish Image">
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="w-40 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors overflow-hidden"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="combo" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload Image</span>
                </>
              )}
            </button>
          </Section>

          {/* Other Details */}
          <Section title="Other Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={comboType} onValueChange={setComboType}>
                  <SelectTrigger><SelectValue placeholder="Select combo-offer type" /></SelectTrigger>
                  <SelectContent>
                    {COMBO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="HS Code">
                <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="Enter HS Code eg. 1211" />
              </Field>
              <Field label="Preparation Time">
                <div className="relative">
                  <Input
                    type="number"
                    value={prepTime || ""}
                    onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                </div>
              </Field>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description">
            <div className="rounded-lg border">
              <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
                {[
                  { icon: Bold, cmd: "bold" },
                  { icon: Italic, cmd: "italic" },
                  { icon: UnderlineIcon, cmd: "underline" },
                  { icon: Strikethrough, cmd: "strikeThrough" },
                  { icon: ListOrdered, cmd: "insertOrderedList" },
                  { icon: List, cmd: "insertUnorderedList" },
                  { icon: AlignLeft, cmd: "justifyLeft" },
                  { icon: AlignCenter, cmd: "justifyCenter" },
                  { icon: AlignRight, cmd: "justifyRight" },
                  { icon: AlignJustify, cmd: "justifyFull" },
                  { icon: RemoveFormatting, cmd: "removeFormat" },
                ].map(({ icon: Icon, cmd }) => (
                  <button
                    key={cmd}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setDescHtml((e.target as HTMLDivElement).innerHTML)}
                data-placeholder="Enter description"
                className="min-h-32 px-3 py-2 text-sm outline-none prose-sm empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
              />
            </div>
          </Section>
        </div>

        {/* ── Live phone preview ── */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <PhonePreview
              name={comboName}
              price={comboOfferPrice}
              originalPrice={displayActualPrice}
              subMenu={subMenu}
              category={categoryName}
              image={image}
              comboItems={comboItems}
              descHtml={descHtml}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[248px] bg-background/95 backdrop-blur border-t px-6 py-3 flex items-center justify-end gap-2 z-30">
        <Button variant="ghost" onClick={resetForm} disabled={saving}>Reset</Button>
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </div>

      {/* ── Add Items Dialog ── */}
      <Dialog open={addItemsOpen} onOpenChange={setAddItemsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Items to Combo</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Input
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              placeholder="Search dishes..."
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-[300px]">
            {filteredMenuItems.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                {allMenuItems.length === 0 ? "No dishes available. Create dishes first." : "No dishes match your search."}
              </div>
            ) : (
              filteredMenuItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => addItems([item])}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category?.name || ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">Rs {item.price}</p>
                    {item.foodType && (
                      <Badge variant="outline" className="text-[10px] mt-0.5">{item.foodType}</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddItemsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Item Dialog ── */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item: {editItem?.name}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <Field label="Variant">
                <Input
                  value={editItem.variant || ""}
                  onChange={(e) => setEditItem({ ...editItem, variant: e.target.value })}
                  placeholder="e.g. Medium"
                />
              </Field>
              <Field label="Add-ons">
                <Input
                  value={editItem.addons || ""}
                  onChange={(e) => setEditItem({ ...editItem, addons: e.target.value })}
                  placeholder="e.g. Extra cheese"
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editItem) {
                setComboItems((prev) => prev.map((ci) => (ci.id === editItem.id ? editItem : ci)));
                setEditItem(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectImageModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        library={library}
        onSelect={(url) => {
          setImage(url);
          if (!library.some((i) => i.url === url)) {
            const fileName = url.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
            setLibrary((prev) => [...prev, { url, name: decodeURIComponent(fileName) }]);
          }
        }}
      />
    </div>
  );
}

// ── Building blocks ──

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="h-2.5 w-2.5 rounded-sm bg-destructive" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs</span>
      <Input
        type="number"
        className="pl-9"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
      />
    </div>
  );
}

function PhonePreview({
  name,
  price,
  originalPrice,
  subMenu,
  category,
  image,
  comboItems,
  descHtml,
}: {
  name: string;
  price: number;
  originalPrice: number;
  subMenu: string;
  category: string;
  image: string | null;
  comboItems: ComboItem[];
  descHtml: string;
}) {
  return (
    <div className="mx-auto w-[300px] rounded-[2.5rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl">
      <div className="rounded-[1.8rem] bg-background overflow-hidden">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-medium">
          <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
          <div className="w-16 h-4 bg-gray-900 rounded-full" />
          <span className="tracking-tight">▪▪▪ 📶 🔋</span>
        </div>
        {/* nav */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4 text-primary" />
            <span className="font-semibold">Combo</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
        {/* card */}
        <div className="p-3">
          {/* image */}
          <div className="w-full h-40 rounded-xl bg-muted overflow-hidden mb-3 flex items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground/30">{comboInitials(name)}</span>
            )}
          </div>

          <div className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{name.trim() || "Combo Name"}</p>
              <div className="text-right flex-shrink-0">
                {originalPrice > 0 && originalPrice !== price && (
                  <span className="text-xs text-muted-foreground line-through">Rs {originalPrice}</span>
                )}
                <span className="text-sm font-medium block">Rs {price}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="outline" className="text-[10px] font-normal">Preparation Time: {comboItems.length > 0 ? "0" : "0"} min</Badge>
              <Badge variant="outline" className="text-[10px] font-normal">Submenu: {subMenu || ""}</Badge>
              <Badge variant="outline" className="text-[10px] font-normal">Category: {category || ""}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {descHtml ? "" : "Description"}
            </p>
          </div>

          {/* Included Items */}
          {comboItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Included Items</p>
              <div className="space-y-2">
                {comboItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {item.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}{item.variant ? ` - ${item.variant}` : ""}</p>
                      <p className="text-[10px] text-muted-foreground">Quantity: {item.quantity}x (Rs {item.price})</p>
                    </div>
                    <span className="text-xs font-medium flex-shrink-0">Rs {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-sm font-medium">Description</span>
            <span className="text-xs text-primary">Edit</span>
          </div>
          <div
            className="text-xs text-muted-foreground mt-1 px-1 min-h-16 prose-sm"
            dangerouslySetInnerHTML={{ __html: descHtml || "" }}
          />
        </div>
      </div>
    </div>
  );
}

function comboInitials(name: string): string {
  return (name.trim() || "CO").slice(0, 2).toUpperCase();
}
