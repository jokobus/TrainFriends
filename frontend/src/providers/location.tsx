import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import {
  getDistanceFromLatLonInKm,
  handleApiErr,
  randomInt32,
  useLocalStorage,
} from "../utils";
import { Api, LocationUser, LoginRequest } from "../api";

import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import BGP from "@capacitor-community/background-geolocation";
import { LocalNotificationsPlugin } from "@capacitor/local-notifications";
import { registerPlugin } from "@capacitor/core";
import { useAuth, useAuthState } from "./auth";

export interface LocationProps {
  userLocation: BGP.Location | null;
  friendLocations: LocationUser[];
}

export type LocationContextType = {
  locationState: LocationProps;
  locationEnabled: boolean;
  setLocationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

const LocalNotifications =
  registerPlugin<LocalNotificationsPlugin>("LocalNotifications");

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const userLocationRef = useRef<BGP.Location | null>(null);
  const [locationState, setLocationState] = useState<LocationProps>({
    userLocation: null,
    friendLocations: [],
  });
  const nearbyFriendsRef = useRef<string[]>([]);
  const watcherRef = useRef<string | null>(null);
  const { isAuthenticated } = useAuthState();

  const [locationEnabled, setLocationEnabled] = useLocalStorage<boolean>(
    "location.enabled",
    true,
  );

  const timeout = 10 * 1000;

  useEffect(() => {
    if (locationEnabled) {
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
    }
  }, [locationEnabled]);

  // periodicallly update userLocation in locationState, send location to server and get friends' locations
  useEffect(() => {
    if (!isAuthenticated || !locationEnabled) {
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
        // Only send to server if user enabled location sharing
        const response = await Api.locationPost({
          location: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        });

        const friendLocations = response.data;

        const nextNearbyFriends = friendLocations
          .filter(
            (fl) => getDistanceFromLatLonInKm(fl.location, userLocation) <= 0.1,
          )
          .map((loc) => loc.username);
        const nextNearbyFriendsUniq = Array.from(
          new Set(nextNearbyFriends),
        ).sort();
        if (
          nextNearbyFriendsUniq.join(",") !== nearbyFriendsRef.current.join(",")
        ) {
          const newNearbyFriends = nextNearbyFriendsUniq.filter(
            (nf) => !nearbyFriendsRef.current.includes(nf),
          );
          const newNearbyFriendsText =
            newNearbyFriends.length === 1
              ? "Friend " + newNearbyFriends[0] + " is nearby."
              : "Friends " + newNearbyFriends.join(", ") + " are nearby.";
          nearbyFriendsRef.current = nextNearbyFriendsUniq;
          LocalNotifications.schedule({
            notifications: [
              {
                title: newNearbyFriendsText,
                body: "",
                largeBody: "",
                summaryText: "",
                id: randomInt32(),
              },
            ],
          });

          console.log("Nearby friends changed:", newNearbyFriends);
        }

        setLocationState((ls) => ({ ...ls, friendLocations }));
      } catch (e: any) {
        console.error(handleApiErr(e));
      }
    }, timeout);
    return () => {
      clearInterval(tIt);
    };
  }, [isAuthenticated]);

  return (
    <LocationContext.Provider
      value={{ locationState, locationEnabled, setLocationEnabled }}
    >
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
