import { ConfigProvider } from "effect";

const runtimeConfigProvider = ConfigProvider.orElse(
  ConfigProvider.fromUnknown(import.meta.env),
  ConfigProvider.fromEnv(),
);

/** Supplies Vite-loaded configuration with a Node environment fallback. */
export const runtimeConfigLayer = ConfigProvider.layer(runtimeConfigProvider);
