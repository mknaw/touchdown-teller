/** @type {import('tailwindcss').Config} */
export const content = [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/features/**/*.{js,ts,jsx,tsx,mdx}',
];
export const plugins = [];
export const theme = {
  extend: {
    spacing: {
      header: '10vh',
      '90vh': '90vh',
      // TODO have to rename
      '10vh': '10vh',
      '50vh': '50vh',
      '50vw': '50vw',
      '60vh': '55vh',
      '30vh': '25vh',
    },
  },
};
