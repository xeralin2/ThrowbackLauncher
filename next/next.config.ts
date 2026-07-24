import type { NextConfig } from "next";
import coverWidths from "./src/config/cover-widths.json";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: coverWidths,
    imageSizes: [],
  },
};

export default nextConfig;
