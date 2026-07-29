"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMenuItem, getCategories, getMenuItems } from "@/lib/actions/menu";
import { getLibrary, type LibraryEntry } from "@/lib/actions/image-library";
import { FOOD_TYPES } from "@/lib/constants";
import SelectImageModal, { type LibraryImage } from "@/components/menu/SelectImageModal";
import { cn } from "@/lib/utils";

const SUB_MENUS = ["Appetizers", "Main Courses", "Desserts", "Beverages", "Extra"];
const KOT_TYPES = ["Kitchen", "Bar", "Bakery", "Grill", "Cold Station"];

type Variant = { name: string; price: number };
type Extra = { name: string; price: number };

export default function CreateDishPage() {
  const router = useRouter();
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  // ── Form state ──
  const [name, setName] = useState("");
  const [subMenu, setSubMenu] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [actualPrice, setActualPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [foodType, setFoodType] = useState("veg");
  const [kotType, setKotType] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [prepTime, setPrepTime] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [descHtml, setDescHtml] = useState("");

  // ── Data ──
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // ── Derived pricing ──
  const listedPrice = useMemo(
    () => Math.max(0, (actualPrice || 0) - (discount || 0)),
    [actualPrice, discount]
  );
  const cogs = 0; // Stock-consumption based COGS not configured yet.
  const grossProfit = Math.max(0, listedPrice - cogs);

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";
  const dishInitials = (name.trim() || "UN").slice(0, 2).toUpperCase();

  const exec = (cmd: string) => {
    document.execCommand(cmd, false);
    descRef.current?.focus();
    setDescHtml(descRef.current?.innerHTML ?? "");
  };

  const resetForm = useCallback(() => {
    setName("");
    setSubMenu("");
    setCategoryId("");
    setActualPrice(0);
    setDiscount(0);
    setFoodType("veg");
    setKotType("");
    setHsCode("");
    setPrepTime(0);
    setImage(null);
    setVariants([]);
    setShowVariants(false);
    setExtras([]);
    setDescHtml("");
    if (descRef.current) descRef.current.innerHTML = "";
  }, []);

  const save = async (thenNew: boolean) => {
    if (!restaurantId) return toast.error("Restaurant not loaded — refresh and retry");
    if (!name.trim()) return toast.error("Dish name is required");
    if (!subMenu) return toast.error("Sub-Menu is required");
    if (!categoryId) return toast.error("Category is required");
    if (!actualPrice || actualPrice <= 0) return toast.error("Actual price is required");

    setSaving(true);
    const res = await addMenuItem({
      restaurantId,
      categoryId,
      name: name.trim(),
      description: descHtml || null,
      price: actualPrice,
      discountPrice: discount > 0 ? listedPrice : null,
      menuSection: subMenu,
      foodType,
      prepTime: prepTime || 15,
      imageUrl: image,
      kotType: kotType || null,
      hsCode: hsCode || null,
      sizeOptions: variants.length > 0 ? variants.filter((v) => v.name.trim()) : null,
      addOns: extras.filter((e) => e.name.trim()),
    });
    setSaving(false);

    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Dish created");
    if (thenNew) {
      resetForm();
    } else {
      router.push("/owner/menu");
    }
  };

  return (
    <div className="pb-28">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/owner/menu")}>
          <ChevronLeft className="h-4 w-4 text-primary" />
        </Button>
        <h1 className="text-2xl font-bold">Create Dish</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* ── Form ── */}
        <div className="space-y-6 max-w-3xl">
          {/* Dish Name */}
          <Field label="Dish Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Dish Name" />
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

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <Field label="Actual Price" required>
              <PriceInput value={actualPrice} onChange={setActualPrice} />
            </Field>
            <Field label="Discount">
              <PriceInput value={discount} onChange={setDiscount} />
            </Field>
            <Button
              variant="outline"
              className="gap-1.5 h-10"
              onClick={() => setShowVariants((v) => !v)}
            >
              <Plus className="h-4 w-4" /> Add Variants
            </Button>
          </div>

          {/* Pricing summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span>Listed Price: <b>Rs {listedPrice}</b></span>
              <span className="text-muted-foreground">COGS: Rs {cogs}</span>
              <span className="text-primary font-medium">Gross Profit: Rs {grossProfit}</span>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Stock consumption setup is coming soon.")}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Setup stock consumption ✎
            </button>
          </div>

          {/* Variants */}
          {showVariants && (
            <RowEditor
              title="Variants"
              rows={variants}
              setRows={setVariants}
              namePlaceholder="e.g. Large"
              addLabel="Add Variant"
            />
          )}

          {/* Dish Image */}
          <Section title="Dish Image">
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="w-40 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors overflow-hidden"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="dish" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload Image</span>
                </>
              )}
            </button>
          </Section>

          {/* Other details */}
          <Section title="Other Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={foodType} onValueChange={setFoodType}>
                  <SelectTrigger><SelectValue placeholder="Select dish type" /></SelectTrigger>
                  <SelectContent>
                    {FOOD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="KOT Type">
                <Select value={kotType} onValueChange={setKotType}>
                  <SelectTrigger><SelectValue placeholder="Select KOT Type" /></SelectTrigger>
                  <SelectContent>
                    {KOT_TYPES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <RowEditor
              title="Add-Ons / Extras"
              rows={extras}
              setRows={setExtras}
              namePlaceholder="e.g. Extra cheese"
              addLabel="Add Extra"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="HS Code">
                <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="Enter HS Code" />
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
              initials={dishInitials}
              name={name}
              price={listedPrice}
              subMenu={subMenu}
              category={categoryName}
              image={image}
              descHtml={descHtml}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[248px] bg-background/95 backdrop-blur border-t px-6 py-3 flex items-center justify-end gap-2 z-30">
        <Button variant="ghost" onClick={resetForm} disabled={saving}>Reset</Button>
        <Button onClick={() => save(false)} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Dish
        </Button>
        <Button onClick={() => save(true)} disabled={saving} variant="secondary">
          Save and New
        </Button>
      </div>

      <SelectImageModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        library={library}
        onSelect={(url) => {
          setImage(url);
          // Add newly uploaded image to the library so it appears in the Library tab
          if (!library.some((i) => i.url === url)) {
            const fileName = url.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
            setLibrary((prev) => [...prev, { url, name: decodeURIComponent(fileName) }]);
          }
        }}
      />
    </div>
  );
}

// ── Small building blocks ──

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

function RowEditor({
  title,
  rows,
  setRows,
  namePlaceholder,
  addLabel,
}: {
  title: string;
  rows: { name: string; price: number }[];
  setRows: (r: { name: string; price: number }[]) => void;
  namePlaceholder: string;
  addLabel: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setRows([...rows, { name: "", price: 0 }])}
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">None added.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={row.name}
                placeholder={namePlaceholder}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                className="flex-1"
              />
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs</span>
                <Input
                  type="number"
                  className="pl-9"
                  value={row.price || ""}
                  placeholder="0"
                  onChange={(e) =>
                    setRows(rows.map((r, j) => (j === i ? { ...r, price: parseFloat(e.target.value) || 0 } : r)))
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhonePreview({
  initials,
  name,
  price,
  subMenu,
  category,
  image,
  descHtml,
}: {
  initials: string;
  name: string;
  price: number;
  subMenu: string;
  category: string;
  image: string | null;
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
            <span className="font-semibold">Dish</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
        {/* card */}
        <div className="p-3">
          <div className="rounded-xl border p-3">
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{name.trim() || "Dish Name"}</p>
                  <span className="text-sm font-medium whitespace-nowrap">Rs {price}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">Sub-Menu: {subMenu || ""}</Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">Category: {category || ""}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {image ? "" : "Dish Photo"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-sm font-medium">Description</span>
            <span className="text-xs text-primary">Edit</span>
          </div>
          <div
            className="text-xs text-muted-foreground mt-1 px-1 min-h-24 prose-sm"
            dangerouslySetInnerHTML={{ __html: descHtml || "" }}
          />
        </div>
      </div>
    </div>
  );
}
