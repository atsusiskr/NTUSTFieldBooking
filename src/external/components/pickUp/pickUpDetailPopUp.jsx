import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslation, translate } from "../../../locale/i18n";
import { statusMap, getStatusLabel } from "../../../constant/statusMap";
import { formatDateTime } from "../../../utils/dateTimeFormat";
import { facilityMap, functionIconMap, InfoIconMap, sportIconMap } from "../../../constant/IconMap";
import HostMessageDialog from "./HostMessageDialog";

export default function PickUpDetailPopUp({ selectedGroup, onRequestJoin, closeDetailModal, isClosing, onContactHost, joining, registrationClosed = false, hideJoin = false }) {
    const t = useTranslation();
    const [showHostMessage, setShowHostMessage] = useState(false);
    const isFull = Number(selectedGroup.current_enrolled || 0) >= Number(selectedGroup.capacity || 0);
    const status = selectedGroup.enrolledStatus;
    const canJoin = status === null && !isFull;
    const detailNote = selectedGroup.description || t("pickUpPage.detail.messages.hostNotYetProvideNotes");
    const location = selectedGroup.location || {};
    const parkingName = typeof location.parking_name === "string" ? location.parking_name.trim() : "";
    const parkingLatitude = Number(location.parking_latitude);
    const parkingLongitude = Number(location.parking_longitude);
    const hasParkingCoordinates = location.parking_latitude !== null && location.parking_latitude !== undefined && location.parking_latitude !== ""
        && location.parking_longitude !== null && location.parking_longitude !== undefined && location.parking_longitude !== ""
        && Number.isFinite(parkingLatitude) && Number.isFinite(parkingLongitude)
        && Math.abs(parkingLatitude) <= 90 && Math.abs(parkingLongitude) <= 180
        && (parkingLatitude !== 0 || parkingLongitude !== 0);
    const parkingDirectionsUrl = hasParkingCoordinates
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${parkingLatitude},${parkingLongitude}`)}&travelmode=driving&dir_action=navigate`
        : null;
    const host = selectedGroup.host || {};
    const hostName = host.display_name || host.username || t("pickUpPage.detail.messages.notProvidedHostInfo");
    const hostUsername = host.username || t("pickUpPage.detail.messages.notProvidedUsername");
    const hostAvatar = host.avatar_thumbnail || host.avatar;
    const canContactHost = Boolean(host.contact_url || host.line_url || host.lineUrl || host.email || host.phone);
    const latitude = selectedGroup.location?.latitude;
    const longitude = selectedGroup.location?.longitude;
    const hasCoordinates = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

    const openLocationInGoogleMaps = () => {
        if (!hasCoordinates) return;

        const query = encodeURIComponent(`${latitude},${longitude}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
    };

    const openParkingInGoogleMaps = () => {
        if (!parkingDirectionsUrl) return;
        window.open(parkingDirectionsUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <section
            role="dialog"
            aria-modal="true"
            className={`max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl ${isClosing ? "pickup-modal-panel-leave" : "pickup-modal-panel-enter"}`}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div className="sticky z-20 top-0 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-3 sm:px-7">
                <div className="min-w-0">
                    <h2 id="pickup-detail-title" className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                        {selectedGroup.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                            <span className="text-base">{sportIconMap[selectedGroup.sport?.code]?.icon}</span>
                            {selectedGroup.sport?.name || t("pickUpPage.detail.messages.pickupGroup")}
                        </span>
                        <span className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold ${isFull ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"}`}>
                            <span className="text-base">{InfoIconMap.host?.icon}</span>
                            {selectedGroup.current_enrolled || 0}/{selectedGroup.capacity || 0} {t("pickUpPage.detail.messages.people")}
                        </span>
                        {registrationClosed && <span className="rounded-md bg-red-100 px-2.5 py-1 font-semibold text-red-700">{t("pickUpPage.detail.messages.registrationAlreadyDeadline")}</span>}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={closeDetailModal}
                    className="ml-4 grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                    <div>
                        {functionIconMap.cancel.icon}
                    </div>
                </button>
            </div>

            <div className="space-y-4 px-5 py-4 sm:px-7">
                <section className="space-y-3">
                    <div className="rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                    <span className="text-lg">{InfoIconMap.time?.icon}</span>
                                    {t("pickUpPage.detail.messages.time")}
                                </p>
                                <p className="mt-1 text-lg font-bold text-gray-900">{formatDateTime(selectedGroup.start_time).date}</p>
                            </div>
                            <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl shadow-sm sm:w-[58%]">
                                <div className="px-3 py-2.5">
                                    <p className="text-xs text-blue-700">{t("pickUpPage.detail.messages.startTime")}</p>
                                    <p className="mt-0.5 font-bold">{formatDateTime(selectedGroup.start_time).time}</p>
                                </div>
                                <div className="border-l border-gray-300 px-3 py-2.5">
                                    <p className="text-xs text-blue-700">{t("pickUpPage.detail.messages.endTime")}</p>
                                    <p className="mt-0.5 font-bold">{formatDateTime(selectedGroup.end_time).time}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 border-t border-gray-100 pt-3">
                            <p className="text-xs font-semibold text-gray-500">{t("pickUpPage.detail.messages.registrationDeadlineDate")}</p>
                            <p className="mt-1 font-semibold text-gray-500">{formatDateTime(selectedGroup.registration_deadline).date} {formatDateTime(selectedGroup.registration_deadline).time}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            disabled={!hasCoordinates}
                            title={hasCoordinates ? t("pickUpPage.detail.tooltips.googleMapsOpenLocation") : t("pickUpPage.detail.tooltips.thisVenueNotYetProvide")}
                            onClick={openLocationInGoogleMaps}
                            className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${hasCoordinates
                                ? "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                                }`}
                        >
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                <span className="text-lg text-blue-600">{InfoIconMap.location?.icon}</span>
                                {t("pickUpPage.detail.messages.location")}
                            </p>
                            <p className="mt-1 truncate font-semibold text-gray-900">{selectedGroup.location?.name || t("pickUpPage.detail.messages.notYetProvide")}</p>
                            {selectedGroup.location?.address && (
                                <p className="mt-1 truncate text-xs text-gray-500">{selectedGroup.location.address}</p>
                            )}
                            {hasCoordinates && <p className="mt-2 text-xs font-semibold text-blue-600">{t("pickUpPage.detail.messages.clickViewMap")}</p>}
                        </button>
                        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500">{t("pickUpPage.detail.messages.levelAndFee")}</p>
                            <p className="mt-1 font-semibold text-gray-900">{selectedGroup.skill_level?.name || t("pickUpPage.detail.messages.level")}</p>
                            <p className="mt-2 inline-flex rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
                                $ {selectedGroup.fee || 0}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-gray-900">{t("pickUpPage.detail.headings.hostInfo")}</h3>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
                            {hostName.charAt(0)}
                            {hostAvatar && (
                                <img
                                    src={hostAvatar}
                                    alt={translate("pickUpPage.detail.images.hostAvatar", { value0: hostName })}
                                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                                    className="absolute inset-0 h-full w-full object-cover z-0"
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{hostName}</p>
                            <p className="mt-0.5 truncate text-sm text-gray-500">@{hostUsername}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setShowHostMessage(true)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <MessageCircle size={16} aria-hidden="true" />
                            {t("pickUpPage.detail.actions.messageHost")}
                        </button>
                        <button
                            type="button"
                            disabled={!canContactHost}
                            title={canContactHost ? t("pickUpPage.detail.tooltips.host") : t("pickUpPage.detail.tooltips.hostNotYetProvideMethod")}
                            onClick={() => onContactHost(host)}
                            className={`min-h-10 rounded-lg border px-4 text-sm font-bold transition ${canContactHost
                                ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                }`}
                        >
                            {t("pickUpPage.detail.actions.host")}
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-gray-900">{t("pickUpPage.detail.headings.venueFacilities")}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedGroup.facilities?.length ? selectedGroup.facilities.map((facilityKey) => {
                            const facility = facilityMap[facilityKey];
                            return (
                                <span key={facilityKey} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    <span className="text-lg text-blue-600 [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">{facility?.icon}</span>
                                    <span>{facility ? t(facility.labelKey) : facilityKey}</span>
                                </span>
                            );
                        }) : <span className="text-sm text-gray-500">{t("pickUpPage.detail.messages.notYetProvideFacilitiesInfo")}</span>}
                    </div>
                </section>

                <button
                    type="button"
                    disabled={!parkingDirectionsUrl}
                    title={parkingDirectionsUrl ? t("pickUpPage.detail.tooltips.googleMapsOpenParking") : t("pickUpPage.detail.tooltips.thisParkingNotYetProvide")}
                    onClick={openParkingInGoogleMaps}
                    className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition ${parkingDirectionsUrl
                        ? "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                        }`}
                >
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                        <span className="text-lg text-blue-600">{facilityMap.parking.icon}</span>
                        {parkingName || t("pickUpPage.detail.messages.parking")}
                    </span>
                    {parkingDirectionsUrl && <span className="mt-2 block text-xs font-semibold text-blue-600">{t("pickUpPage.detail.messages.clickViewMap")}</span>}
                </button>

                <div>
                    <h3 className="font-bold text-gray-900">{t("pickUpPage.detail.headings.hostNotes")}</h3>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl   py-3 text-sm leading-5 text-gray-700">{detailNote}</p>
                </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white px-5 py-3 sm:px-7">
                <button
                    type="button"
                    onClick={closeDetailModal}
                    className="min-h-11 flex-1 rounded-lg border border-gray-300 px-4 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    {t("common.actions.close")}
                </button>
                {!hideJoin && <button
                    type="button"
                    disabled={!canJoin || joining}
                    onClick={() => onRequestJoin(selectedGroup)}
                    className={`min-h-11 flex-1 rounded-lg px-4 font-bold text-white transition ${!canJoin || joining ? "cursor-not-allowed opacity-60" : "hover:opacity-90"} ${registrationClosed && canJoin ? "bg-gray-500" : isFull && status === null ? statusMap.full.class : (statusMap[status]?.class || statusMap.default.class)}`}
                >
                    {joining ? t("pickUpPage.detail.actions.processing") : status !== null
                        ? getStatusLabel(status, t)
                        : registrationClosed && !isFull
                            ? t("pickUpPage.detail.actions.registrationAlreadyDeadline")
                        : isFull
                            ? getStatusLabel("full", t)
                            : getStatusLabel("default", t)}
                </button>}
            </div>
            {showHostMessage && (
                <HostMessageDialog
                    groupId={selectedGroup.id}
                    groupTitle={selectedGroup.title}
                    onClose={() => setShowHostMessage(false)}
                />
            )}
        </section>
    )
}
