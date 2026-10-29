import { getDistance } from "./distance";

export const EMPTY_FIELDS = [];

const PIN_COLORS = [
  "#E74C3C", "#E67E22", "#F1C40F", "#2ECC71",
  "#3498DB", "#0501e2ff", "#9B59B6",
];

export function buildPlacesWithColor(fields, currentPosition, t) {
  if (!currentPosition) return [];

  return fields
    .map((field) => ({ ...field, lat: Number(field.latitude), lng: Number(field.longitude) }))
    .filter((field) => Number.isFinite(field.lat) && Number.isFinite(field.lng))
    .map((field, index) => {
      const distanceKm = getDistance(currentPosition.lat, currentPosition.lng, field.lat, field.lng);
      return {
        ...field,
        index,
        distanceKm,
        distanceText: t("距離約 {distance} 公里", { distance: distanceKm.toFixed(2) }),
        color: PIN_COLORS[index % PIN_COLORS.length],
      };
    });
}
