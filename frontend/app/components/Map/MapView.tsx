"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Polyline,
  CircleMarker
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const startIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const goalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapController({
  start,
  goal,
  path,
}: {
  start: { lat: number; lon: number } | null;
  goal: { lat: number; lon: number } | null;
  path?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after layout rendering
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  // Smoothly fit bounds when path is calculated
  useEffect(() => {
    if (path && path.length > 1) {
      try {
        const bounds = L.latLngBounds(path.map(([lat, lon]) => [lat, lon]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (err) {
        console.error("Fit bounds error:", err);
      }
    } else if (start && goal) {
      try {
        const bounds = L.latLngBounds([
          [start.lat, start.lon],
          [goal.lat, goal.lon],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (err) {
        console.error("Fit bounds error:", err);
      }
    }
  }, [map, path, start, goal]);

  return null;
}

interface MapViewProps {
  start: { lat: number; lon: number } | null;
  goal: { lat: number; lon: number } | null;
  onMapClick: (lat: number, lon: number) => void;
  path?: [number, number][];
  pathColor?: string;
  visitedColor?: string;
  isDashed?: boolean;
  visitedNodes?: [number, number][];
}

export default function MapView({
  start,
  goal,
  onMapClick,
  path,
  pathColor = "#9333ea",
  visitedColor = "#3b82f6",
  isDashed = false,
  visitedNodes
}: MapViewProps) {
  // Hanoi center by default
  const defaultCenter: [number, number] = [21.0285, 105.8542];

  return (
    <div className="h-full w-full min-h-[500px] overflow-hidden rounded-xl border border-slate-200 z-0 relative">
      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 space-y-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: visitedColor, opacity: 0.5 }} />
          Đã duyệt
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pathColor }} />
          Đường đi
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Bắt đầu
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Đích
        </div>
      </div>

      <MapContainer
        center={start ? [start.lat, start.lon] : defaultCenter}
        zoom={13}
        preferCanvas={true}
        className="h-full w-full min-h-[500px] z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <MapController start={start} goal={goal} path={path} />
        <MapClickHandler onSelect={onMapClick} />

        {start && (
          <Marker position={[start.lat, start.lon]} icon={startIcon}>
            <Popup>Điểm bắt đầu</Popup>
          </Marker>
        )}

        {goal && (
          <Marker position={[goal.lat, goal.lon]} icon={goalIcon}>
            <Popup>Điểm đích</Popup>
          </Marker>
        )}

        {/* Visited Nodes Animation */}
        {visitedNodes && visitedNodes.map((pos, idx) => (
          <CircleMarker
            key={`visited-${idx}`}
            center={pos}
            radius={4}
            pathOptions={{ stroke: false, fillColor: visitedColor, fillOpacity: 0.35 }}
          />
        ))}

        {path && path.length > 0 && (
          <Polyline
            positions={path}
            color={pathColor}
            weight={5}
            opacity={0.85}
            dashArray={isDashed ? "8, 8" : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}
