import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix: tell Turbopack the project root is THIS folder, not C:\Users\ja021\
  // This silences the warning caused by a stray package-lock.json in the home directory
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
