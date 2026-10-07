/** SVG paths on a 24×24 grid. Selected tabs fill `solid` (minus `cutout`), else a bolder `stroke`. */
export interface TabIcon {
  stroke: string;
  solid?: string;
  cutout?: string;
  dot?: string;
}

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

export const TabIcons = {
  home: {
    stroke: "M3.5 10.5L12 3.5l8.5 7V20a1 1 0 01-1 1H15v-6H9v6H4.5a1 1 0 01-1-1z",
    solid: "M3.1 10.2L12 2.9l8.9 7.3V20a1.4 1.4 0 01-1.4 1.4H4.5A1.4 1.4 0 013.1 20z",
    cutout: "M10 21.5V16h4v5.5",
  },
  search: {
    stroke: `${circle(10.5, 10.5, 6.5)}M15.5 15.5L20 20`,
  },
  compass: {
    stroke: `${circle(12, 12, 9)}M15.5 8.5l-2 5-5 2 2-5 5-2z`,
    solid: circle(12, 12, 9.4),
    cutout: "M15.5 8.5l-2 5-5 2 2-5 5-2z",
  },
  shield: {
    stroke: "M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3zM9 12l2 2 4-4",
    solid: "M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z",
    cutout: "M9 12l2 2 4-4",
  },
  wallet: {
    stroke: "M3 7a2 2 0 012-2h13a1 1 0 011 1v3H5a2 2 0 00-2 2V7zM3 11a2 2 0 012-2h15v10a1 1 0 01-1 1H5a2 2 0 01-2-2V11z",
    solid: "M3 7a2 2 0 012-2h13a1 1 0 011 1v3H5a2 2 0 00-2 2V7zM3 11a2 2 0 012-2h15v10a1 1 0 01-1 1H5a2 2 0 01-2-2V11z",
    dot: circle(16, 14, 1.3),
  },
  sparkle: {
    stroke: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  },
  users: {
    stroke: `${circle(9, 8, 3)}M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6${circle(17, 7, 2.5)}M15 14c3.3 0 6 2 6 5`,
    solid: `${circle(9, 8, 3.4)}M2.6 20.4c0-3.6 2.9-6.6 6.4-6.6s6.4 3 6.4 6.6z${circle(17, 7, 2.8)}M15.6 13.6c3.6 0 6 2.2 6 5.6h-4.6c0-2.4-0.5-4-1.4-5.6z`,
  },
  person: {
    stroke: `${circle(12, 8, 4)}M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8`,
    solid: `${circle(12, 8, 4.4)}M3.6 21.4c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4z`,
  },
  heart: {
    stroke: "M12 20s-7-4.4-9-9a4.8 4.8 0 019-3.2A4.8 4.8 0 0121 11c-2 4.6-9 9-9 9z",
    solid: "M12 20.5s-7.4-4.6-9.4-9.3a5.2 5.2 0 019.4-3.8 5.2 5.2 0 019.4 3.8c-2 4.7-9.4 9.3-9.4 9.3z",
  },
  bell: {
    stroke: "M6 16v-5a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4",
    solid: "M5.6 15.8V11a6.4 6.4 0 0112.8 0v4.8l2.3 2.6H3.3zM9.5 20.2a2.5 2.5 0 005 0z",
  },
  chat: {
    stroke: "M5 4.5h14a1.5 1.5 0 011.5 1.5v9.5a1.5 1.5 0 01-1.5 1.5H10l-5 4v-4a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 015 4.5z",
    solid: "M5 4.1h14A1.9 1.9 0 0120.9 6v9.5a1.9 1.9 0 01-1.9 1.9h-8.8l-5.6 4.4v-4.4A1.9 1.9 0 013.1 15.5V6A1.9 1.9 0 015 4.1z",
  },
  calendar: {
    stroke: "M4 6.5a1.5 1.5 0 011.5-1.5h13A1.5 1.5 0 0120 6.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5zM4 10h16M8 3v4M16 3v4",
    solid: "M3.6 6.5a1.9 1.9 0 011.9-1.9h13a1.9 1.9 0 011.9 1.9v13a1.9 1.9 0 01-1.9 1.9h-13a1.9 1.9 0 01-1.9-1.9z",
    cutout: "M4 10h16",
  },
} satisfies Record<string, TabIcon>;
