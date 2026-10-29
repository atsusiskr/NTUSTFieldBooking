import { useTranslation, translate } from "../../../locale/i18n";
import { statusMap, getStatusLabel } from "../../../constant/statusMap";
import { formatDateTime } from "../../../utils/dateTimeFormat";
import { facilityMap, functionIconMap, InfoIconMap, sportIconMap } from "../../../constant/IconMap";

export default function PickUpDetailPopUp({ selectedGroup, onRequestJoin, closeDetailModal, isClosing, onContactHost, joining, registrationClosed = false, hideJoin = false }) {
  const t = useTranslation();
    const isFull = Number(selectedGroup.current_enrolled || 0) >= Number(selectedGroup.capacity || 0);
    const status = selectedGroup.enrolledStatus;
    const canJoin = status === null && !isFull;
    const detailNote = selectedGroup.description || t("主揪尚未提供額外備註。");
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
    const hostName = host.display_name || host.username || t("未提供主揪資訊");
    const hostUsername = host.username || t("未提供 username");
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
                            {selectedGroup.sport?.name || t("臨打團")}
                        </span>
                        <span className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold ${isFull ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"}`}>
                            <span className="text-base">{InfoIconMap.host?.icon}</span>
                            {selectedGroup.current_enrolled || 0}/{selectedGroup.capacity || 0} {t("人")}
                        </span>
                        {registrationClosed && <span className="rounded-md bg-red-100 px-2.5 py-1 font-semibold text-red-700">{t("報名已截止")}</span>}
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
                                    {t("活動時間")}
                                </p>
                                <p className="mt-1 text-lg font-bold text-gray-900">{formatDateTime(selectedGroup.start_time).date}</p>
                            </div>
                            <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl shadow-sm sm:w-[58%]">
                                <div className="px-3 py-2.5">
                                    <p className="text-xs text-blue-700">{t("開始時間")}</p>
                                    <p className="mt-0.5 font-bold">{formatDateTime(selectedGroup.start_time).time}</p>
                                </div>
                                <div className="border-l border-gray-300 px-3 py-2.5">
                                    <p className="text-xs text-blue-700">{t("結束時間")}</p>
                                    <p className="mt-0.5 font-bold">{formatDateTime(selectedGroup.end_time).time}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 border-t border-gray-100 pt-3">
                            <p className="text-xs font-semibold text-gray-500">{t("報名截止日期")}</p>
                            <p className="mt-1 font-semibold text-gray-500">{formatDateTime(selectedGroup.registration_deadline).date} {formatDateTime(selectedGroup.registration_deadline).time}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            disabled={!hasCoordinates}
                            title={hasCoordinates ? t("在 Google Maps 開啟位置") : t("此場地尚未提供座標")}
                            onClick={openLocationInGoogleMaps}
                            className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${hasCoordinates
                                ? "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                                }`}
                        >
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                <span className="text-lg text-blue-600">{InfoIconMap.location?.icon}</span>
                                {t("地點")}
                            </p>
                            <p className="mt-1 truncate font-semibold text-gray-900">{selectedGroup.location?.name || t("尚未提供")}</p>
                            {selectedGroup.location?.address && (
                                <p className="mt-1 truncate text-xs text-gray-500">{selectedGroup.location.address}</p>
                            )}
                            {hasCoordinates && <p className="mt-2 text-xs font-semibold text-blue-600">{t("點擊查看地圖 →")}</p>}
                        </button>
                        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500">{t("程度與費用")}</p>
                            <p className="mt-1 font-semibold text-gray-900">{selectedGroup.skill_level?.name || t("不限程度")}</p>
                            <p className="mt-2 inline-flex rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
                                $ {selectedGroup.fee || 0}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-gray-900">{t("主揪資訊")}</h3>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
                            {hostName.charAt(0)}
                            {hostAvatar && (
                                <img
                                    src={hostAvatar}
                                    alt={translate("{value0} 的頭像", { value0: hostName })}
                                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                                    className="absolute inset-0 h-full w-full object-cover z-0"
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{hostName}</p>
                            <p className="mt-0.5 truncate text-sm text-gray-500">@{hostUsername}</p>
                        </div>
                        <button
                            type="button"
                            disabled={!canContactHost}
                            title={canContactHost ? t("聯絡主揪") : t("主揪尚未提供聯絡方式")}
                            onClick={() => onContactHost(host)}
                            className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-bold transition ${canContactHost
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "cursor-not-allowed bg-gray-100 text-gray-400"
                                }`}
                        >
                            {t("聯絡主揪")}
                        </button>
                    </div>
                </section>

                <div>
                    <h3 className="font-bold text-gray-900">{t("場地設施")}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedGroup.facilities?.length ? selectedGroup.facilities.map((facilityKey) => {
                            const facility = facilityMap[facilityKey];
                            return (
                                <span key={facilityKey} className="flex w-[76px] flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-gray-700">
                                    <span className="text-xl">{facility?.icon}</span>
                                    <span className="text-xs font-medium">{facility ? t(facility.name) : facilityKey}</span>
                                </span>
                            );
                        }) : <span className="text-sm text-gray-500">{t("尚未提供設施資訊")}</span>}
                    </div>
                </div>

                <button
                    type="button"
                    disabled={!parkingDirectionsUrl}
                    title={parkingDirectionsUrl ? t("在 Google Maps 開啟停車場導航") : t("此停車場尚未提供座標")}
                    onClick={openParkingInGoogleMaps}
                    className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition ${parkingDirectionsUrl
                        ? "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                        }`}
                >
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                        <span className="text-lg text-blue-600">{facilityMap.parking.icon}</span>
                        {parkingName || t("停車場")}
                    </span>
                    {parkingDirectionsUrl && <span className="mt-2 block text-xs font-semibold text-blue-600">{t("點擊查看地圖 →")}</span>}
                </button>

                <div>
                    <h3 className="font-bold text-gray-900">{t("主揪備註")}</h3>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl   py-3 text-sm leading-5 text-gray-700">{detailNote}</p>
                </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white px-5 py-3 sm:px-7">
                <button
                    type="button"
                    onClick={closeDetailModal}
                    className="min-h-11 flex-1 rounded-lg border border-gray-300 px-4 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    {t("關閉")}
                </button>
                {!hideJoin && <button
                    type="button"
                    disabled={!canJoin || joining}
                    onClick={() => onRequestJoin(selectedGroup)}
                    className={`min-h-11 flex-1 rounded-lg px-4 font-bold text-white transition ${!canJoin || joining ? "cursor-not-allowed opacity-60" : "hover:opacity-90"} ${registrationClosed && canJoin ? "bg-gray-500" : isFull && status === null ? statusMap.full.class : (statusMap[status]?.class || statusMap.default.class)}`}
                >
                    {joining ? t("處理中...") : status !== null
                        ? getStatusLabel(status, t)
                        : registrationClosed && !isFull
                            ? t("報名已截止")
                        : isFull
                            ? getStatusLabel("full", t)
                            : getStatusLabel("default", t)}
                </button>}
            </div>
        </section>
    )
}
