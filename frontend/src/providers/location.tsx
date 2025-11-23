import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { handleApiErr, useLocalStorage } from "../utils";
import { Api, LocationUser, LoginRequest } from "../api";

import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import BGP from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";
import { useAuth, useAuthState } from "./auth";

export interface LocationProps {
  userLocation: BGP.Location | null;
  friendLocations: LocationUser[];
}

export type LocationContextType = {
  locationState: LocationProps;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const userLocationRef = useRef<BGP.Location | null>(null);
  const [locationState, setLocationState] = useState<LocationProps>({
    userLocation: null,
    friendLocations: [],
  });
  const watcherRef = useRef<string | null>(null);
  const { isAuthenticated } = useAuthState();

  const timeout = 10 * 1000; // ½ minute

  useEffect(() => {
    (async () => {
      watcherRef.current = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Cancel to prevent battery drain.",
          backgroundTitle: "Tracking location.",
          requestPermissions: true,
          stale: false,
        },
        (location) => (userLocationRef.current = location ?? null),
      );
    })();
    return () => {
      watcherRef.current &&
        BackgroundGeolocation.removeWatcher({ id: watcherRef.current });
    };
  }, []);

  // periodicallly update userLocation in locationState, send location to server and get friends' locations
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const tIt = setInterval(async () => {
      const userLocation = userLocationRef.current;
      if (!userLocation) {
        return;
      }
      setLocationState((ls) => ({
        ...ls,
        userLocation: userLocation,
      }));
      try {
        const response = await Api.locationPost({
          location: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        });

        setLocationState((ls) => ({ ...ls, friendLocations: response.data }));
      } catch (e: any) {
        console.error(handleApiErr(e));
      }
    }, timeout);
    return () => {
      clearTimeout(tIt);
    };
  }, [isAuthenticated]);

  return (
    <LocationContext.Provider value={{ locationState }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within an LocationProvider");
  }
  return context;
};

export const useLocationState = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationState must be used within an LocationProvider");
  }
  return context.locationState;
};
