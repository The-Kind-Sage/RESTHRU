import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "vegan", label: "Vegan" },
  { id: "spicy", label: "Spicy" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "chefs-pick", label: "Chef's Pick" },
  { id: "signature", label: "Signature" },
] as const;

export function FilterPanel({
  open,
  onClose,
  active,
  setActive,
}: {
  open: boolean;
  onClose: () => void;
  active: string;
  setActive: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
            className="paper-texture fixed right-0 top-0 z-50 flex h-full w-[300px] flex-col p-8"
            style={{ backgroundColor: "var(--paper)", boxShadow: "-12px 0 40px rgba(0,0,0,0.15)" }}
          >
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ink-mute)" }}>
                  Refine
                </p>
                <h2 className="mt-1 font-serif text-2xl" style={{ color: "var(--burgundy)" }}>Dietary</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="transition-colors"
                style={{ color: "var(--ink-soft)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--burgundy)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {FILTERS.map((f) => {
                const isActive = active === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActive(f.id)}
                    className="group flex items-center justify-between border px-4 py-3 text-left font-sans text-[11px] font-medium uppercase tracking-[0.2em] transition-all"
                    style={{
                      borderColor: isActive ? "var(--burgundy)" : "rgba(197,165,90,0.4)",
                      backgroundColor: isActive ? "var(--burgundy)" : "transparent",
                      color: isActive ? "var(--paper)" : "var(--ink)",
                    }}
                  >
                    <span>{f.label}</span>
                    {isActive && <span style={{ color: "var(--gold-soft)" }}>◆</span>}
                  </button>
                );
              })}
            </div>

            <p className="mt-8 font-serif text-[12px] italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Non-matching dishes remain visible but softened, so nothing is hidden from your table.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
