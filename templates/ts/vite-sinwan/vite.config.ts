import { defineConfig } from "vite";
import { sinwan } from "vite-plugin-sinwan";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), sinwan()],
});
