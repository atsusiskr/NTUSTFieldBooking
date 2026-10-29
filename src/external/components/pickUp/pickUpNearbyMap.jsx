import { useTranslation, translate } from "../../../locale/i18n";
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RiMapPin2Fill, RiMapPinUserFill } from "react-icons/ri";
import { IoPinSharp } from "react-icons/io5";


const containerStyle = {
    height: "350px",
    borderRadius: "10px",
    margin: "10px auto",
    position: "relative",
    zIndex: 0,
}

const defaultCenter = { lat: 25.013, lng: 121.541 };
const markerOffset = () => ({ x: -12, y: -24 });
const hasCoordinateValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const isValidPosition = ({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0);

export default function GroupNearbyMap({ groups, onSelectGroup }) {
  const t = useTranslation();
    const [currentPosition, setCurrentPosition] = useState(() => {
        try {
            const savedPosition = JSON.parse(localStorage.getItem('currentPosition') || 'null');
            if (!hasCoordinateValue(savedPosition?.lat) || !hasCoordinateValue(savedPosition?.lng)) return null;
            const position = { lat: Number(savedPosition?.lat), lng: Number(savedPosition?.lng) };
            return isValidPosition(position) ? position : null;
        } catch {
            return null;
        }
    });
    const [mapReady, setMapReady] = useState(false);
    const [selectedLocationKey, setSelectedLocationKey] = useState(null);
    const mapRef = useRef(null);
    const locationMarkers = useMemo(() => {
        const locations = new Map();

        (groups || []).forEach((group) => {
            const location = group.location;
            if (!hasCoordinateValue(location?.latitude) || !hasCoordinateValue(location?.longitude)) return;

            const position = { lat: Number(location.latitude), lng: Number(location.longitude) };
            if (!isValidPosition(position)) return;

            const key = `${position.lat},${position.lng}`;
            if (!locations.has(key)) {
                locations.set(key, { key, position, name: location.name || t("活動地點"), groups: [] });
            }
            locations.get(key).groups.push(group);
        });

        return [...locations.values()];
    }, [groups, t]);
    const selectedLocation = locationMarkers.find(({ key }) => key === selectedLocationKey);
    const mapCenter = currentPosition || locationMarkers[0]?.position || defaultCenter;
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-id',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
    });

    const handleRecenter = () => {
        if (currentPosition && mapRef.current) {
            mapRef.current.panTo(currentPosition);
        }
    };

    useEffect(() => {
        if (!mapReady || !mapRef.current || !window.google?.maps) return;

        const points = [...new Map([currentPosition, ...locationMarkers.map(({ position }) => position)]
            .filter(Boolean)
            .map((point) => [`${point.lat},${point.lng}`, point])).values()];
        if (points.length === 0) return;
        if (points.length === 1) {
            mapRef.current.panTo(points[0]);
            mapRef.current.setZoom(15);
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((point) => bounds.extend(point));
        mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }, [mapReady, currentPosition, locationMarkers]);

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                if (!isValidPosition(newPos)) return;
                setCurrentPosition(newPos);
                localStorage.setItem("currentPosition", JSON.stringify(newPos));
            },
            (err) => console.warn("定位失敗", err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    if (!isLoaded || !window.google) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative z-0">
        <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={15}
            options={
                {
                    zoomControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    disableDefaultUI: true,
                    styles: [
                        {
                            featureType: "poi",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                }
            }
            onLoad={(map) => { mapRef.current = map; setMapReady(true); }}
            onUnmount={() => { mapRef.current = null; }}
            center={mapCenter}
        >
            {/* 顯示自己的位置 */}
            {mapReady && currentPosition && (
                <OverlayView
                    position={currentPosition}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={markerOffset}
                >
                    <div className="text-blue-500 drop-shadow-md">
                        <RiMapPinUserFill className="block h-6 w-6" />
                    </div>
                </OverlayView>
            )}
            {mapReady && locationMarkers.map(({ key, name, groups: locationGroups, position }) => (
                <OverlayView
                    key={key}
                    position={position}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={markerOffset}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedLocationKey((previous) => previous === key ? null : key)}
                        aria-label={translate("查看{value0}的 {value1} 場活動", { value0: name, value1: locationGroups.length })}
                        className="group relative block h-6 w-6 text-red-500 drop-shadow-md"
                    >
                        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 shadow-md transition-colors group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-600">
                            {locationGroups.length === 1
                                ? translate("{value0} ({value1}/{value2}人)", { value0: locationGroups[0].title, value1: locationGroups[0].current_enrolled || 0, value2: locationGroups[0].capacity || 0 })
                                : translate("{value0} · {value1} 場活動", { value0: name, value1: locationGroups.length })}
                        </span>
                        <RiMapPin2Fill className="block h-6 w-6" />
                    </button>
                </OverlayView>
            ))}
            {/* 回到目前位置按鈕 */}
            {currentPosition && (
                <button
                    type="button"
                    className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    onClick={handleRecenter}
                    title={t("回到目前位置")}
                >
                    <IoPinSharp size={24} color="#333" />
                </button>
            )}
        </GoogleMap>
        {selectedLocation && (
            <div className="absolute left-4 top-4 z-20 w-72 max-w-[calc(100%-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-bold text-gray-900">{selectedLocation.name}</p>
                        <p className="text-xs text-gray-500">{t("這裡有")} {selectedLocation.groups.length} {t("場活動")}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedLocationKey(null)} aria-label={t("關閉活動清單")} className="rounded px-2 text-xl leading-none text-gray-500 hover:bg-gray-100">×</button>
                </div>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {selectedLocation.groups.map((group) => (
                        <li key={group.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLocationKey(null);
                                    onSelectGroup?.(group);
                                }}
                                className="w-full rounded-lg px-2 py-2 text-left hover:bg-blue-50"
                            >
                                <span className="block font-semibold text-gray-900">{group.title}</span>
                                <span className="text-xs text-gray-500">{group.current_enrolled || 0}/{group.capacity || 0} {t("人・點擊查看詳情")}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        </div>
    );
}
