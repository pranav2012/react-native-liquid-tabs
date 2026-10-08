export type SceneKind = "peaks" | "dunes" | "waves" | "hills" | "city";

export interface SceneSpec {
  kind: SceneKind;
  seed: number;
  sky: string[];
  sun: { x: number; y: number; r: number; color: string };
  layers: string[];
  horizon?: number;
  stars?: boolean;
  balloons?: string[];
}

export type Category = "Mountains" | "Beaches" | "Cities" | "Deserts" | "Countryside";

export interface Destination {
  id: string;
  name: string;
  country: string;
  category: Category;
  rating: number;
  days: number;
  price: number;
  scene: SceneSpec;
}

export const CATEGORIES: ("All" | Category)[] = ["All", "Mountains", "Beaches", "Cities", "Deserts", "Countryside"];

export const DESTINATIONS: Destination[] = [
  {
    id: "dolomites",
    name: "Dolomites",
    country: "Italy",
    category: "Mountains",
    rating: 4.9,
    days: 6,
    price: 1240,
    scene: {
      kind: "peaks",
      seed: 4,
      sky: ["#2E3192", "#E96F92", "#FFC59E"],
      sun: { x: 0.68, y: 0.3, r: 0.08, color: "#FFE9C7" },
      layers: ["#9A5C9E", "#6E3F82", "#45285E", "#22143A"],
      horizon: 0.42,
    },
  },
  {
    id: "sahara",
    name: "Merzouga",
    country: "Morocco",
    category: "Deserts",
    rating: 4.8,
    days: 4,
    price: 680,
    scene: {
      kind: "dunes",
      seed: 9,
      sky: ["#F6D365", "#FDA085"],
      sun: { x: 0.3, y: 0.3, r: 0.1, color: "#FFF6DE" },
      layers: ["#F0A868", "#E08648", "#C4652F", "#94461E"],
      horizon: 0.55,
    },
  },
  {
    id: "maldives",
    name: "Baa Atoll",
    country: "Maldives",
    category: "Beaches",
    rating: 4.9,
    days: 7,
    price: 2890,
    scene: {
      kind: "waves",
      seed: 2,
      sky: ["#56CCF2", "#A6E4FF", "#E4F8FF"],
      sun: { x: 0.78, y: 0.22, r: 0.07, color: "#FFFFFF" },
      layers: ["#4FB3E8", "#2F8FD8", "#1C6DC0", "#0E4C96", "#08316B"],
      horizon: 0.55,
    },
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    category: "Countryside",
    rating: 4.8,
    days: 5,
    price: 1580,
    scene: {
      kind: "hills",
      seed: 12,
      sky: ["#FF758C", "#FF9FA8", "#FFD9B5"],
      sun: { x: 0.5, y: 0.45, r: 0.12, color: "#FFF1E6" },
      layers: ["#D8698A", "#B04B71", "#843357", "#561E3D"],
      horizon: 0.52,
    },
  },
  {
    id: "iceland",
    name: "Kirkjufell",
    country: "Iceland",
    category: "Mountains",
    rating: 4.9,
    days: 8,
    price: 2140,
    scene: {
      kind: "peaks",
      seed: 21,
      sky: ["#070B1F", "#123A5A", "#1FA97A"],
      sun: { x: 0.22, y: 0.18, r: 0.04, color: "#EAF2FF" },
      layers: ["#1A3A52", "#11283D", "#0A1828"],
      horizon: 0.5,
      stars: true,
    },
  },
  {
    id: "newyork",
    name: "New York",
    country: "United States",
    category: "Cities",
    rating: 4.7,
    days: 4,
    price: 1320,
    scene: {
      kind: "city",
      seed: 33,
      sky: ["#141E30", "#35395F", "#F7797D"],
      sun: { x: 0.8, y: 0.25, r: 0.035, color: "#FFF2E0" },
      layers: ["#3A3E62", "#23263E", "#12142A"],
      horizon: 0.55,
      stars: true,
    },
  },
  {
    id: "santorini",
    name: "Santorini",
    country: "Greece",
    category: "Beaches",
    rating: 4.8,
    days: 5,
    price: 1460,
    scene: {
      kind: "waves",
      seed: 17,
      sky: ["#FA709A", "#FDA88A", "#FEE140"],
      sun: { x: 0.4, y: 0.5, r: 0.11, color: "#FFF8E1" },
      layers: ["#5A7FE0", "#3F62C4", "#2B47A0", "#1B2F78"],
      horizon: 0.58,
    },
  },
  {
    id: "patagonia",
    name: "Torres del Paine",
    country: "Chile",
    category: "Mountains",
    rating: 4.9,
    days: 9,
    price: 2360,
    scene: {
      kind: "peaks",
      seed: 41,
      sky: ["#8EB8F7", "#C2E9FB", "#EAF7FF"],
      sun: { x: 0.15, y: 0.22, r: 0.06, color: "#FFFFFF" },
      layers: ["#A4BFE3", "#7495C8", "#4C6EA2", "#2D4A78"],
      horizon: 0.4,
    },
  },
  {
    id: "cappadocia",
    name: "Cappadocia",
    country: "Türkiye",
    category: "Deserts",
    rating: 4.8,
    days: 3,
    price: 740,
    scene: {
      kind: "dunes",
      seed: 55,
      sky: ["#FFB88C", "#F58A7A", "#DE6262"],
      sun: { x: 0.75, y: 0.55, r: 0.08, color: "#FFE7D1" },
      layers: ["#D48766", "#AE6247", "#7D4030", "#52281F"],
      horizon: 0.6,
      balloons: ["#FF5E5B", "#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#F78C6B"],
    },
  },
  {
    id: "bali",
    name: "Ubud",
    country: "Indonesia",
    category: "Countryside",
    rating: 4.7,
    days: 6,
    price: 980,
    scene: {
      kind: "hills",
      seed: 63,
      sky: ["#F9D976", "#F7B58C", "#F39F86"],
      sun: { x: 0.62, y: 0.35, r: 0.1, color: "#FFF7D6" },
      layers: ["#8CC08B", "#5EA06F", "#367F56", "#1C5C40", "#0D3D2B"],
      horizon: 0.48,
    },
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    category: "Cities",
    rating: 4.8,
    days: 5,
    price: 1690,
    scene: {
      kind: "city",
      seed: 77,
      sky: ["#2B1055", "#7597DE", "#FFB3C6"],
      sun: { x: 0.3, y: 0.32, r: 0.06, color: "#FFE4EC" },
      layers: ["#5B4E9A", "#3B3170", "#1F1A45"],
      horizon: 0.55,
    },
  },
];

export const byId = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d])) as Record<string, Destination>;

export const COLLECTIONS = [
  { id: "summer", title: "Summer 2027", places: ["santorini", "maldives", "bali"] },
  { id: "peaks", title: "Big mountains", places: ["patagonia", "dolomites", "iceland"] },
  { id: "cities", title: "City weekends", places: ["tokyo", "newyork", "kyoto"] },
];
