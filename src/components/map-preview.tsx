"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

export type MapPreviewProps = {
  origin: [number, number]; // [lon, lat]
  destination: [number, number]; // [lon, lat]
};

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const FitBounds = ({ points }: { points: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, points]);

  return null;
};

export function MapPreview({ origin, destination }: MapPreviewProps) {
  const originLatLng = useMemo<LatLngExpression>(() => [origin[1], origin[0]], [origin]);
  const destinationLatLng = useMemo<LatLngExpression>(
    () => [destination[1], destination[0]],
    [destination]
  );

  const points = useMemo(() => [originLatLng, destinationLatLng], [destinationLatLng, originLatLng]);

  return (
    <MapContainer
      center={originLatLng}
      zoom={12}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-64 w-full overflow-hidden rounded-xl border border-brand-primary/20"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitBounds points={points} />
      <Polyline positions={points} pathOptions={{ color: "#5c7cfa", weight: 4, opacity: 0.85 }} />
      <CircleMarker
        center={originLatLng}
        radius={10}
        pathOptions={{ color: "#a855f7", fillColor: "#f3e8ff", fillOpacity: 0.9, weight: 2 }}
      >
        <title>Dispatch origin</title>
      </CircleMarker>
      <CircleMarker
        center={destinationLatLng}
        radius={10}
        pathOptions={{ color: "#5dd4ff", fillColor: "#e0f7ff", fillOpacity: 0.9, weight: 2 }}
      >
        <title>Requested drop-off</title>
      </CircleMarker>
    </MapContainer>
  );
}
