import { MapPin, Clock, Phone, Globe, AtSign } from "lucide-react";
import { MenuPage } from "./MenuPage";

export function BackCoverPage({
  restaurant,
  pageNumber,
  flow = false,
}: {
  restaurant: { name: string; address: string; hours: string; phone: string; website: string; social: string };
  pageNumber?: number;
  flow?: boolean;
}) {
  return (
    <MenuPage pageNumber={pageNumber} flow={flow}>
      <div className={`flex flex-col items-center justify-center text-center ${flow ? "py-10" : "h-full"}`}>
        <p className="font-serif italic text-[15px]" style={{ color: "var(--ink-soft)" }}>
          Thank you for dining with us.
        </p>
        <div className="my-6 flex items-center gap-3">
          <span className="h-px w-12" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>◆</span>
          <span className="h-px w-12" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
        <h2 className="font-serif italic text-[32px] sm:text-[40px]" style={{ color: "var(--burgundy)" }}>
          {restaurant.name}
        </h2>

        <div className="mt-10 grid gap-4 text-sm" style={{ color: "var(--ink-soft)" }}>
          <Row icon={<MapPin size={14} />} text={restaurant.address} />
          <Row icon={<Clock size={14} />} text={restaurant.hours} />
          <Row icon={<Phone size={14} />} text={restaurant.phone} />
          <Row icon={<Globe size={14} />} text={restaurant.website} />
          <Row icon={<AtSign size={14} />} text={restaurant.social} />
        </div>

        <div className="mt-10 flex items-center gap-3">
          <span className="h-px w-20" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>✦</span>
          <span className="h-px w-20" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
        <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.4em]" style={{ color: "var(--ink-mute)" }}>
          À bientôt
        </p>
      </div>
    </MenuPage>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 font-sans text-[13px]">
      <span style={{ color: "var(--gold)" }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
