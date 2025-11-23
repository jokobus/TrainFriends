import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import eslint from "vite-plugin-eslint";

export default ({ mode }) => {
  const isDebug = mode === "debug" || mode === "prod-debug";

  return {
    publicDir: "public",
    build: isDebug ? { sourcemap: true, minify: false } : {}, // FIXME: remove this when finished debugging
    plugins: [
      react(),
      checker({
        typescript: true,
      }),
      eslint(),
    ],
  };
};
