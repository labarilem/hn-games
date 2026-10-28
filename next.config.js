/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

// The local edit mode is a development-only tool. In every non-dev phase the
// imports used by the app are redirected to inert stubs, so the editor UI and
// the filesystem/child-process implementation never enter the build.
// Turbopack resolves aliases as project-relative module requests; absolute
// Windows paths (and backslashes) are not accepted, so keep these relative.
const productionOnlyStubs = {
  "@/dev/edit-mode": "./src/dev/edit-mode.prod.tsx",
  "@/dev/edit-server": "./src/dev/edit-server.prod.ts",
  "@/dev/edit-fields": "./src/dev/edit-fields.prod.ts",
};

const productionOnlyStubsForWebpack = Object.fromEntries(
  Object.entries(productionOnlyStubs).map(([specifier, file]) => [
    specifier,
    path.resolve(__dirname, file),
  ]),
);

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    turbopack: isDevelopment
      ? {}
      : {
          resolveAlias: productionOnlyStubs,
        },
    webpack(config, { dev }) {
      if (!dev) {
        config.resolve.alias = {
          ...config.resolve.alias,
          ...productionOnlyStubsForWebpack,
        };
      }
      return config;
    },
  };

  return nextConfig;
};
