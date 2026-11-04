import { getDistance } from "./distance";

export const EMPTY_VENUES = [];

const PIN_COLORS = [
  "#E74C3C", "#E67E22", "#F1C40F", "#2ECC71",
  "#3498DB", "#0501e2ff", "#9B59B6",
];

export function buildPlacesWithColor(venues, currentPosition, t) {
  if (!currentPosition) return [];

  return venues
    .map((venue) => ({ ...venue, lat: Number(venue.latitude), lng: Number(venue.longitude) }))
    .filter((venue) => Number.isFinite(venue.lat) && Number.isFinite(venue.lng))
    .map((venue, index) => {
      const distanceKm = getDistance(currentPosition.lat, currentPosition.lng, venue.lat, venue.lng);
      return {
        ...venue,
        index,
        distanceKm,
        distanceText: t("距離約 {distance} 公里", { distance: distanceKm.toFixed(2) }),
        color: PIN_COLORS[index % PIN_COLORS.length],
      };
    });
}
