export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  tags?: string[];
  details?: string[];
  featured?: boolean;
}

export interface DrinkItemData {
  id: string;
  name: string;
  description?: string;
  price: number;
  group: "wine" | "cocktail";
  featured?: boolean;
  imageUrl?: string | null;
}

// A renderable menu section (built client-side from MenuData.categories —
// empty categories are dropped so they never produce blank pages).
export interface SectionData {
  id: string;
  title: string;
  kicker?: string;
  items: MenuItemData[];
  tint?: boolean;
}

export interface MenuData {
  restaurant: {
    name: string;
    tagline: string;
    established: string;
    address: string;
    hours: string;
    phone: string;
    website: string;
    social: string;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    items: MenuItemData[];
  }[];
  drinks: DrinkItemData[];
}
