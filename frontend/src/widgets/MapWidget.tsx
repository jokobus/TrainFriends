import React from "react";
import { Box, Typography } from "@mui/material";
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

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

export const MapWidget: React.FC<{
  locations: LocationUser[];
  /** Optional color mapping or color palette. If object, keys are usernames (case-insensitive). If array, colors assigned in order of unique users. */
  colors?: Record<string, string> | string[];
}> = ({ locations, colors }) => {
  if (!locations || locations.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
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

  // FIXME: assign colors based on username
  // Build color mapping for users present in `recent`.
  const defaultPalette = [
    "#d9534f",
    "#0275d8",
    "#5cb85c",
    "#6f42c1",
    "#f0ad4e",
    "#20c997",
    "#e83e8c",
    "#795548",
    "#17a2b8",
    "#cddc39",
    "#ff69b4",
    "#6c757d",
  ];

  // Preserve first-seen original casing for legend display, and collect unique lowercase usernames in order
  const uniqueUsersLower: string[] = [];
  const firstSeenName: Record<string, string> = {};
  recent.forEach((r) => {
    const k = r.username.toLowerCase();
    if (!firstSeenName[k]) firstSeenName[k] = r.username;
    if (!uniqueUsersLower.includes(k)) uniqueUsersLower.push(k);
  });

  const colorMap: Record<string, string> = {};
  if (colors && !Array.isArray(colors)) {
    // user provided explicit map; normalize keys to lowercase
    Object.entries(colors).forEach(([k, v]) => (colorMap[k.toLowerCase()] = v));
    // ensure every user has a color (fallback to defaults)
    uniqueUsersLower.forEach((u, i) => {
      if (!colorMap[u]) colorMap[u] = defaultPalette[i % defaultPalette.length];
    });
  } else {
    const palette =
      Array.isArray(colors) && colors.length > 0 ? colors : defaultPalette;
    uniqueUsersLower.forEach(
      (u, i) => (colorMap[u] = palette[i % palette.length]),
    );
  }

  // MapAutoSize must be rendered inside MapContainer; it uses useMap() to invalidate and fit bounds
  const MapAutoSize: React.FC<{ bounds?: any }> = ({ bounds }) => {
    const map = useMap();
    React.useEffect(() => {
      const t = setTimeout(() => {
        try {
          map.invalidateSize();
          if (bounds) map.fitBounds(bounds);
        } catch (e) {
          /* ignore */
        }
      }, 150);
      const onResize = () => map.invalidateSize();
      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", onResize);
      };
    }, [map, bounds]);
    return null;
  };

  const latLngBnd =
    latLngs.length > 1 ? (L.latLngBounds(latLngs) as any) : undefined;

  return (
    <Box
      sx={{
        width: 1000,
        maxWidth: "100%",
        height: 420,
      }}
    >
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
      <MapContainer
        center={
          latLngs.length === 1
            ? latLngs[0]
            : latLngBnd
              ? latLngBnd.getCenter()
              : undefined
        }
        bounds={latLngBnd}
        zoom={13}
        // style ={{ width: 320, maxWidth: "100%", "@media (max-width:480px)": {width: "90vw", maxWidth: 320 }}}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoSize bounds={latLngBnd} />

        {recent.map(({ username, location, timestamp, ageMs }, idx) => {
          const position: [number, number] = [
            location.latitude,
            location.longitude,
          ];

          // Map username -> color (from computed colorMap)
          const uname = username.toLowerCase();
          const color = colorMap[uname] ?? defaultPalette[0];

          // Compute opacity: transparency increases from 0 to 0.7 over 15 minutes
          // transparency = (age / 15min) * 0.7, so opacity = 1 - transparency
          const transparency = Math.min(1, ageMs / FIFTEEN_MIN_MS) * 0.7;
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
