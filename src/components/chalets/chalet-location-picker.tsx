"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon references image paths that don't survive
// Next's bundler — point them at the same CDN copy of the package instead
// of trying to make webpack resolve them.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centered on Palestine (West Bank + Gaza), zoomed out enough to show both
// without the admin needing to pan on first load.
const DEFAULT_CENTER: [number, number] = [31.95, 35.15];
const DEFAULT_ZOOM = 9;
const PIN_ZOOM = 14;

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Client-only (Leaflet touches `window` at import time) — must be loaded via
 * `next/dynamic(..., { ssr: false })` wherever it's used, never imported directly.
 */
export function ChaletLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPosition =
    typeof latitude === "number" && typeof longitude === "number" && !Number.isNaN(latitude) && !Number.isNaN(longitude);
  const position: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={position}
          zoom={hasPosition ? PIN_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "320px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {hasPosition && (
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const pos = (e.target as L.Marker).getLatLng();
                  onChange(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        {hasPosition
          ? "Click elsewhere or drag the pin to adjust — the coordinates below update automatically."
          : "Click on the map to drop a pin at the chalet's exact location."}
      </p>
    </div>
  );
}
