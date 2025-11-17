// tailwind.config.js
import { withAccountKitUi } from "@account-kit/react/tailwind";

/** @type {import('tailwindcss').Config} */
export default withAccountKitUi({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
});
