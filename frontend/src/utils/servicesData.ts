export interface ServiceItem {
  id: string;
  name: string;
}

export interface ServiceSubCategory {
  title: string;
  startingPrice?: string;
  items: ServiceItem[];
}

export interface CategoryData {
  category: "hair" | "skin" | "nails";
  label: string;
  subCategories: ServiceSubCategory[];
}

export const servicesCatalog: CategoryData[] = [
  {
    category: "hair",
    label: "Hair",
    subCategories: [
      {
        title: "Haircuts & Styling",
        startingPrice: "₹299",
        items: [
          { id: "h1", name: "Women's Haircut" },
          { id: "h2", name: "Men's Haircut" },
          { id: "h3", name: "Hair Trimming" },
          { id: "h4", name: "Bangs / Fringe Cut" },
          { id: "h5", name: "Hair Wash" },
          { id: "h6", name: "Blow Dry" },
          { id: "h7", name: "Hair Styling" },
          { id: "h8", name: "Curls & Straightening" },
        ],
      },
      {
        title: "Hair Colour",
        startingPrice: "₹2,999",
        items: [
          { id: "hc1", name: "Global Hair Colour" },
          { id: "hc2", name: "Root Touch-Up" },
          { id: "hc4", name: "Highlights" },
          { id: "hc5", name: "Balayage" },
          { id: "hc6", name: "Ombre" },
          { id: "hc7", name: "Creative Colours" },
          { id: "hc8", name: "Men's Hair Colour" },
        ],
      },
      {
        title: "Texture Treatments",
        items: [
          { id: "hs1", name: "Keratin Treatment" },
          { id: "hs5", name: "Hair Botox" },
          { id: "hs2", name: "Hair Smoothening" },
          { id: "hs3", name: "Hair Rebonding" },
          { id: "hs4", name: "Permanent Hair Straightening" },
        ],
      },
      {
        title: "Hair Care",
        items: [
          { id: "ht1", name: "Hair Spa" },
          { id: "ht2", name: "Deep Conditioning" },
          { id: "ht5", name: "Hair Repair Treatment" },
        ],
      },
    ],
  },
  {
    category: "skin",
    label: "Skin",
    subCategories: [
      {
        title: "Facials & Skin Care",
        startingPrice: "₹899",
        items: [
          { id: "st1", name: "Face Cleanup" },
          { id: "f1", name: "Basic Facial" },
          { id: "f2", name: "Fruit Facial" },
          { id: "f3", name: "Gold Facial" },
          { id: "f4", name: "Diamond Facial" },
          { id: "f5", name: "Hydrating Facial" },
          { id: "f6", name: "Brightening Facial" },
          { id: "f7", name: "Anti-Ageing Facial" },
          { id: "f8", name: "De-Tan Facial" },
          { id: "f9", name: "Sensitive Skin Facial" },
        ],
      },
      {
        title: "Waxing",
        items: [
          { id: "wx1", name: "Rica Wax" },
          { id: "wx2", name: "Regular Wax" },
        ],
      },
    ],
  },
  {
    category: "nails",
    label: "Nails",
    subCategories: [
      {
        title: "Nail Services",
        startingPrice: "₹499",
        items: [
          { id: "ne1", name: "Nail Extensions" },
          { id: "nc2", name: "Gel Polish" },
          { id: "na1", name: "Nail Art" },
          { id: "nc4", name: "Manicure" },
          { id: "nc5", name: "Pedicure" },
        ],
      },
    ],
  },
];

export interface CatalogServiceOption {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  startingPrice?: string;
}

let catalogServiceId = 0;
export const catalogServiceOptions: CatalogServiceOption[] = servicesCatalog.flatMap((category) =>
  category.subCategories.flatMap((subCategory) =>
    subCategory.items.map((item) => ({
      id: ++catalogServiceId,
      name: item.name,
      category: category.label,
      subcategory: subCategory.title,
      startingPrice: subCategory.startingPrice,
    }))
  )
);
