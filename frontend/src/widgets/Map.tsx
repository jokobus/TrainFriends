import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { latitude: number; longitude: number };

export type LocationEntry = {
  username: string;
  location: LatLng;
  timestamp: string | number | Date;
};

const COLORS = [
  "#e6194b",
  "#3cb44b",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
];

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c+c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function FitBounds({ latlngs }: { latlngs: L.LatLngExpression[] }) {
  const map = useMap();
  if (!latlngs || latlngs.length === 0) return null;
  try {
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  } catch (e) {
    // ignore
  }
  return null;
}

export const Map = ({
  locations,
  height = 400,
}: {
  locations: LocationEntry[];
  height?: number | string;
}) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  // filter and normalize
  const recent = useMemo(() => {
    return (locations || [])
      .map((l) => ({
        ...l,
        ts: typeof l.timestamp === "number" ? l.timestamp : +new Date(l.timestamp),
      }))
      .filter((l) => now - l.ts <= windowMs && !Number.isNaN(l.ts));
  }, [locations, now]);

  // group by username and sort by time
  const byUser = useMemo(() => {
    const map: Record<string, { ts: number; lat: number; lng: number }[]> = {};
    recent.forEach((r) => {
      const u = r.username || "unknown";
      map[u] = map[u] || [];
      map[u].push({ ts: r.ts, lat: r.location.latitude, lng: r.location.longitude });
    });
    Object.keys(map).forEach((u) => {
      map[u].sort((a, b) => a.ts - b.ts);
    });
    return map;
  }, [recent]);

  const allLatLngs = useMemo(() => {
    const arr: L.LatLngExpression[] = [];
    Object.values(byUser).forEach((list) => {
      list.forEach((p) => arr.push([p.lat, p.lng]));
    });
    return arr;
  }, [byUser]);

  const userList = Object.keys(byUser);

  const userColor = (username: string) => {
    const idx = Math.abs(
      username.split("").reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 0)
    ) % COLORS.length;
    return COLORS[idx];
  };

  const center: L.LatLngExpression = allLatLngs.length > 0 ? (allLatLngs[0] as any) : [0, 0];

  return (
    <div style={{ width: "100%", height }}>
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userList.map((user) => {
          const pts = byUser[user];
          const color = userColor(user);
          return (
            <React.Fragment key={user}>
              {pts.length >= 2 && (
                <Polyline
                  positions={pts.map((p) => [p.lat, p.lng] as L.LatLngExpression)}
                  pathOptions={{ color, weight: 3, opacity: 0.6 }}
                />
              )}

              {pts.map((p, i) => {
                const age = now - p.ts;
                const rel = Math.max(0, Math.min(1, 1 - age / windowMs)); // 1 = newest, 0 = oldest
                const alpha = 0.8 * rel; // 0..0.8
                const fill = hexToRgba(color, alpha);
                const stroke = hexToRgba(color, Math.min(0.9, alpha + 0.2));
                return (
                  <CircleMarker
                    key={`${user}-${p.ts}-${i}`}
                    center={[p.lat, p.lng]}
                    radius={6}
                    pathOptions={{ color: stroke, fillColor: fill, fillOpacity: alpha, weight: 1 }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                      <div style={{ fontSize: 12 }}>
                        <strong>{user}</strong>
                        <div>{new Date(p.ts).toLocaleString()}</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </React.Fragment>
          );
        })}

        <FitBounds latlngs={allLatLngs} />
      </MapContainer>
    </div>
  );
};

export default Map;
