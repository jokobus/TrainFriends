import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import {
  TileLayer,
  Popup,
  CircleMarker,
  useMap,
  MapContainer,
} from "react-leaflet";
import L from "leaflet";

// Ensure marker icons load correctly with Vite bundling
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { LocationUser } from "../api";
import { useLocation } from "../providers/location";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// https://stackoverflow.com/a/66494926/13534562
export const stringToColor = (str: string): string => {
  const stringUniqueHash = [...str].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
};

export const MapWidget: React.FC<{
  locations: LocationUser[];
  /** Optional color mapping or color palette. If object, keys are usernames (case-insensitive). If array, colors assigned in order of unique users. */
  colors?: Record<string, string> | string[];
}> = ({ locations, colors }) => {
  const firstRenderpRef = React.useRef(true);
  const { locationEnabled } = useLocation();

  const SetInitialParams = ({
    bounds,
    center,
    zoom,
  }: {
    bounds: any;
    center: any;
    zoom: any;
  }) => {
    const map = useMap();
    React.useEffect(() => {
      if (firstRenderpRef.current) {
        console.log("Setting initial map view");
        map.setView(center, zoom);
        if (locations.length > 1 && bounds) {
          console.log("Fitting bounds:", bounds);
          map.fitBounds(bounds);
        }
      }
      firstRenderpRef.current = false;
    }, []);
    return null;
  };

  if (!locations || locations.length <= 1) {
    return (
      <Box sx={{ p: 2 }}>
        {!locationEnabled && (
          <Box sx={{ pb: 1 }}>
            <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
              Location sharing is turned off — server updates are paused.
            </Alert>
          </Box>
        )}
        <Typography align="center">No location data</Typography>
      </Box>
    );
  }

  // Filter to last 15 minutes and compute per-marker opacity based on age
  const now = Date.now();
  const FIFTEEN_MIN_MS = 15 * 60 * 1000;

  const recent = locations
    .map((loc) => {
      const t = Date.parse(loc.ts);
      const ageMs = now - t;
      return { ...loc, timestamp: t, ageMs };
    })
    .filter(
      (l) =>
        !Number.isNaN(l.timestamp) && l.ageMs >= 0 && l.ageMs <= FIFTEEN_MIN_MS,
    );

  if (recent.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        {!locationEnabled && (
          <Box sx={{ pb: 1 }}>
            <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
              Location sharing is turned off — server updates are paused.
            </Alert>
          </Box>
        )}
        <Typography align="center">
          No recent location data (last 15 min)
        </Typography>
      </Box>
    );
  }

  // convert to Leaflet's [lat, lng] order for bounds
  const latLngs = recent.map(
    (r) => [r.location.latitude, r.location.longitude] as [number, number],
  );

  // Preserve first-seen original casing for legend display, and collect unique lowercase usernames in order
  const uniqueUsersLower: string[] = [];
  const firstSeenName: Record<string, string> = {};
  recent.forEach((r) => {
    const k = r.username.toLowerCase();
    if (!firstSeenName[k]) firstSeenName[k] = r.username;
    if (!uniqueUsersLower.includes(k)) uniqueUsersLower.push(k);
  });

  const colorMap: Record<string, string> = {};
  uniqueUsersLower.forEach((u) => (colorMap[u] = stringToColor(u)));

  const latLngBnd =
    latLngs.length > 1 ? (L.latLngBounds(latLngs) as any) : undefined;
  console.log("latLngBnd:", latLngBnd);

  return (
    <Box
      sx={{
        width: 1000,
        maxWidth: "100%",
        height: 420,
      }}
    >
      {/* If location sharing is disabled, show a short informational message */}
      {!locationEnabled && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
            Location sharing is turned off — server updates are paused.
          </Alert>
        </Box>
      )}
      {/* Legend: username -> color (dynamic based on recent users) */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          pb: 1,
          flexWrap: "wrap",
        }}
      >
        {uniqueUsersLower.map((u) => (
          <Box key={u} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: colorMap[u],
              }}
            />
            <Typography variant="caption">{firstSeenName[u]}</Typography>
          </Box>
        ))}
      </Box>
      <MapContainer style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {
          <SetInitialParams
            center={
              latLngs.length === 1
                ? latLngs[0]
                : latLngBnd
                  ? latLngBnd.getCenter()
                  : undefined
            }
            bounds={latLngBnd}
            zoom={13}
          />
          // <MapAutoSize bounds={latLngBnd} />
        }

        {recent.map(({ username, location, timestamp, ageMs }, idx) => {
          const position: [number, number] = [
            location.latitude,
            location.longitude,
          ];

          // Map username -> color (from computed colorMap)
          const uname = username.toLowerCase();
          const color = colorMap[uname];

          // Compute opacity: transparency increases from 0 to 0.3 over 15 minutes
          // transparency = (age / 15min) * 0.3, so opacity = 1 - transparency
          const transparency = Math.min(1, ageMs / FIFTEEN_MIN_MS) * 0.3;
          const opacity = Math.max(0.3, 1 - transparency); // clamp to [0.3, 1]

          return (
            <CircleMarker
              key={`${username}-${idx}`}
              center={position}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                opacity: opacity,
                fillOpacity: opacity,
              }}
            >
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{username}</strong>
                  <div>{new Date(timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
};
