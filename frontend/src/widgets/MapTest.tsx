import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapTest = ({ height = 420 }: { height?: number | string }) => {
  const center = [48.137154, 11.576124] as [number, number];
  return (
    <div style={{ width: "100%", height }}>
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    </div>
  );
};

export default MapTest;
