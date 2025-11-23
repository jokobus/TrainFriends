import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.hacka.TrainFriends",
  appName: "Trainfriends",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    useLegacyBridge: true,
  },
};

export default config;
