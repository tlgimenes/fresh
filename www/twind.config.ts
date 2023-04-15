import { defineConfig } from "https://esm.sh/@twind/core@1.1.3";
import presetTailwind from "https://esm.sh/@twind/preset-tailwind@1.0.1";

export default defineConfig({
  darkMode: false,
  presets: [presetTailwind()],
});
