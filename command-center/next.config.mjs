/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output bundles a minimal Node server (.next/standalone/server.js)
  // that the Electron desktop shell boots. Harmless for plain `next start`.
  output: "standalone",
  // The app reads career-ops data files from the parent repo at runtime.
  // Keep server-only fs/child_process out of the client bundle.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // imapflow/mailparser pull in optional native-ish deps; don't try to bundle them.
  serverExternalPackages: ["imapflow", "mailparser"],
};

export default nextConfig;
