import { useTranslation, translate } from "../../locale/i18n";
import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Loading from "../../components/loading";
import { bookingService } from "../../service/bookingService";
import { pickUpService } from "../../service/pickUpService";
import { statusMap, getStatusLabel } from "../../constant/statusMap";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { sportIconMap, functionIconMap } from "../../constant/IconMap";
import { MapPinned } from "lucide-react";
import PickUpDetailPopUp from "../components/pickUp/pickUpDetailPopUp";
import { isRegistrationClosed } from "../utils/pickUpTiming";
import { getHistoricalOrders, isOrderExpired, sortOrdersForDisplay } from "../utils/orderDisplay";
import { getPickUpPartyDetails } from "../utils/pickUpOrderDetails";
import { describeRequestError } from "../../utils/requestError";
import { bookingTimestamp, formatBookingDateTime } from "../../utils/bookingDateTime";

const STARTING_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

const getDirectionsUrl = (location) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    const hasCoordinates = location?.latitude !== null && location?.latitude !== undefined && location?.latitude !== ""
        && location?.longitude !== null && location?.longitude !== undefined && location?.longitude !== ""
        && Number.isFinite(latitude) && Number.isFinite(longitude)
        && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
        && (latitude !== 0 || longitude !== 0);
    const address = typeof location?.address === "string" ? location.address.trim() : "";
    const name = typeof location?.name === "string" ? location.name.trim() : "";
    const destination = hasCoordinates ? `${latitude},${longitude}` : (address || name);
    return destination
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving&dir_action=navigate`
        : null;
};

const isStartingSoon = (order, now, isPickupOrder) => {
    if (["cancelled", "cancel_request", "cancelled_request", "rejected"].includes(order.status)) return false;
    const startTime = isPickupOrder ? new Date(order.start_time).getTime() : bookingTimestamp(order.start_time, order);
    const timeUntilStart = startTime - now;
    return Number.isFinite(startTime) && timeUntilStart > 0 && timeUntilStart <= STARTING_SOON_WINDOW_MS;
};

const isPickupCancellationClosed = (order, now) => {
    const startTime = new Date(order?.start_time ?? order?.start).getTime();
    return Number.isFinite(startTime) && startTime - now < STARTING_SOON_WINDOW_MS;
};

const resourceSportCodes = {
    baseball: "BASEBALL",
    volleyball: "VOLLEYBALL",
    badminton: "BADMINTON",
    tennis: "TENNIS",
    football: "SOCCER",
    soccer: "SOCCER",
    basketball: "BASKETBALL",
};

function OrderSportTag({ order }) {
    const t = useTranslation();
    const sport = order.sport;
    const resourceType = order.resource?.resource_type?.toLowerCase();
    const code = (typeof sport === "string" ? sport : sport?.code) || resourceSportCodes[resourceType];
    const name = (typeof sport === "object" ? sport?.name : null) || sportIconMap[code]?.name;
    if (!name) return null;

    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm font-normal text-gray-600">
            {sportIconMap[code]?.icon}
            {t(name)}
        </span>
    );
}

const genderLabels = { male: "男性", female: "女性", other: "其他" };

function PickUpPartyInfo({ details }) {
  const t = useTranslation();
    return <section aria-label={t("團體報名資訊")} className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-blue-800">{t("團體報名 ·")} {details.partySize} {t("人（含本人）")}</h3>
        </div>
        <p className="mt-3 font-semibold text-slate-700">{t("成員資料")}</p>
        {details.members.length > 0 ? <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {details.members.map((member, index) => <li key={index} className="rounded-lg border border-blue-100 bg-white p-3">
                <p className="font-semibold text-slate-900">{t("第")} {index + 1} {t("位 ·")} {index === 0 ? t("本人") : translate("團員 {value0}", { value0: index })}</p>
                <p className="mt-1 text-slate-600">{t("性別：{gender}", { gender: t(genderLabels[member?.gender] || "未提供") })}</p>
                <p className="text-slate-600">{t("程度：")}{member?.skill_level !== null && member?.skill_level !== undefined && member?.skill_level !== ""
                    ? member.skill_level : t("未提供")}</p>
            </li>)}
        </ol> : <p className="mt-2 text-slate-500">{t("這筆訂單尚未提供成員資料。")}</p>}
        {details.members.length > 0 && details.members.length < details.partySize &&
            <p className="mt-2 text-slate-500">{t("其餘")} {details.partySize - details.members.length} {t("位成員資料尚未提供。")}</p>}
    </section>;
}

export default function OrderPage({ historyOnly = false }) {
  const t = useTranslation();
    const [orders, setOrders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadErrors, setLoadErrors] = useState({});
    const [activeTab, setActiveTab] = useState(historyOnly ? "history" : "pickup");
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
    const [cancellingIds, setCancellingIds] = useState(() => new Set());
    const [cancelActionError, setCancelActionError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const [selectedPickUpGroup, setSelectedPickUpGroup] = useState(null);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetchOrder = async () => {
            try {
                let userId = null;
                try { userId = JSON.parse(localStorage.getItem("userId")); } catch { /* 損壞的快取不應阻止載入訂單 */ }
                const query = userId ? { user_id: userId } : {};
                const [bookingResult, pickupResult] = await Promise.allSettled([
                    bookingService.getBookingList(query, true),
                    pickUpService.getMyPickUpList(true),
                ]);
                setOrders({
                    booking: bookingResult.status === "fulfilled" ? bookingResult.value : { items: [] },
                    pickUp: pickupResult.status === "fulfilled" ? pickupResult.value : [],
                });
                setLoadErrors({
                    booking: bookingResult.status === "rejected" ? bookingResult.reason : null,
                    pickup: pickupResult.status === "rejected" ? pickupResult.reason : null,
                });
            } catch (err) {
                setLoadErrors({ booking: err, pickup: err });
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [refreshTrigger]);

    const openCancelModal = (order) => {
        if (activeTab === "pickup" && order.detailsUnavailable) return;
        if (activeTab === "pickup" && isPickupCancellationClosed(order, Date.now())) {
            setNow(Date.now());
            return;
        }
        setCancelActionError(null);
        setSelectedCancelOrder({
            id: order.id,
            ordereName: activeTab === "booking" ? order.location.name + " - " + (order?.resource?.name ?? "") : order.title,
            start: order?.start_time,
            end: order?.end_time,
            bookingSeriesId: order?.booking_series_id,
        });
        setCancelModalOpen(true);
    };

    const closeCancelModal = () => {
        if (selectedCancelOrder?.id && cancellingIds.has(selectedCancelOrder.id)) return;
        setCancelModalOpen(false);
        setSelectedCancelOrder(null);
        setCancelActionError(null);
    };

    const openPickUpDetail = (order) => {
        if (!order.pickupGroup) return;
        setSelectedPickUpGroup({ ...order.pickupGroup, enrolledStatus: order.status || "pending" });
    };

    const handleContactHost = (host) => {
        const contactUrl = host.contact_url || host.line_url || host.lineUrl;
        if (contactUrl) {
            window.open(contactUrl, "_blank", "noopener,noreferrer");
        } else if (host.email) {
            window.location.href = `mailto:${host.email}`;
        } else if (host.phone) {
            window.location.href = `tel:${host.phone}`;
        }
    };

    const confirmCancel = async () => {
        if (!selectedCancelOrder?.id) return;
        if (activeTab === "pickup" && isPickupCancellationClosed(selectedCancelOrder, Date.now())) {
            setNow(Date.now());
            setCancelModalOpen(false);
            setSelectedCancelOrder(null);
            setCancelActionError(null);
            return;
        }
        const orderId = selectedCancelOrder.id;

        setCancellingIds((prev) => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
        });

        try {
            if (activeTab === "pickup") {
                await pickUpService.cancelPickUpOrder(orderId);
            } else {
                await bookingService.requestCancellation(orderId);
            }

            setOrders((prev) => {
                if (activeTab === "booking") {
                    return {
                        ...prev,
                        booking: {
                            ...prev.booking,
                            items: prev.booking.items.map(o => o.id === orderId ? { ...o, status: "cancelled_request" } : o)
                        }
                    };
                } else {
                    return {
                        ...prev,
                        pickUp: prev.pickUp.map(o => o.id === orderId ? { ...o, status: "cancel_request" } : o)
                    };
                }
            });

            // 順便把 loading 狀態解掉
            setCancellingIds((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
            setCancelModalOpen(false);
            setSelectedCancelOrder(null);
            setCancelActionError(null);
        } catch (err) {
            setCancellingIds((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
            setCancelActionError(err);
        }
    };

    const bookingOrders = orders?.booking?.items || [];
    const pickupOrders = orders?.pickUp || [];
    const visibleOrders = activeTab === "history"
        ? getHistoricalOrders(bookingOrders, pickupOrders, now)
        : sortOrdersForDisplay(
            (activeTab === "booking" ? bookingOrders : pickupOrders)
                .filter((order) => !isOrderExpired(order, now, activeTab)), now, activeTab
        );
    const cancelTime = (value) => activeTab === "booking"
        ? formatBookingDateTime(value, { booking_series_id: selectedCancelOrder?.bookingSeriesId })
        : formatDateTime(value);
    const cancelStart = cancelTime(selectedCancelOrder?.start);
    const cancelEnd = cancelTime(selectedCancelOrder?.end);

    return (
        <div className="app-page pb-12 text-slate-900">
            <Navbar />
            <Loading isLoading={loading} text={t("取得訂單資料中...")} />
            {(activeTab === "history" ? ["pickup", "booking"] : [activeTab]).map((kind) => loadErrors[kind] &&
                <p key={kind} role="alert" className="mx-auto mb-3 w-[95%] max-w-3xl rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    取得{kind === "pickup" ? "臨打團" : "場地"}訂單失敗：{describeRequestError(loadErrors[kind]).message}
                </p>)}
            {!loading && orders &&
                (
                    <div>
                        <h1 className="text-3xl font-bold text-center my-8">{historyOnly ? t("歷史預約") : t("我的預約")}</h1>

                        {/* Tab Buttons */}
                        {!historyOnly && <div className="flex justify-center w-full mb-6">
                            <div className="inline-flex max-w-[95%] bg-blue-50 p-1 rounded-lg shadow-inner">
                                <button
                                    className={`w-24 sm:w-32 py-2 text-center rounded-md transition-all duration-200 text-sm sm:text-base font-bold ${activeTab === "pickup"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    onClick={() => setActiveTab("pickup")}
                                >
                                    {t("臨打團")}
                                </button>

                                <button
                                    className={`w-24 sm:w-32 py-2 text-center rounded-md transition-all duration-200 text-sm sm:text-base font-bold ${activeTab === "booking"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    onClick={() => setActiveTab("booking")}
                                >
                                    {t("場地預約")}
                                </button>

                            </div>
                        </div>}

                        {/* Order List */}
                        {visibleOrders.length === 0 && !loadErrors[activeTab] && !(activeTab === "history" && (loadErrors.pickup || loadErrors.booking)) && (
                            <p className="mx-auto w-[95%] rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-gray-500 md:w-[50%]">
                                {activeTab === "history" ? t("目前沒有歷史預約") : t("目前沒有進行中或即將開始的預約")}
                            </p>
                        )}
                        <ul>
                            {visibleOrders.map((order) => {
                                const directionsUrl = getDirectionsUrl(order.location);
                                const isPickupOrder = activeTab === "pickup" || (activeTab === "history" && order.orderKind === "pickup");
                                const canOpenPickUpDetail = isPickupOrder && Boolean(order.pickupGroup);
                                const start = isPickupOrder ? formatDateTime(order.start_time) : formatBookingDateTime(order.start_time, order);
                                const end = isPickupOrder ? formatDateTime(order.end_time) : formatBookingDateTime(order.end_time, order);
                                const partyDetails = isPickupOrder ? getPickUpPartyDetails(order) : null;
                                const startingSoon = activeTab !== "history" && isStartingSoon(order, now, isPickupOrder);
                                const pickupCancellationClosed = isPickupOrder && isPickupCancellationClosed(order, now);
                                return (
                                    <li
                                        key={`${order.orderKind || activeTab}-${order.id}`}
                                        onClick={canOpenPickUpDetail ? () => openPickUpDetail(order) : undefined}
                                        className={`w-[95%] md:w-[50%] mx-auto mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors ${canOpenPickUpDetail ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50/50" : ""} ${order.status === "cancelled" ? "opacity-40" : ""}`}
                                    >

                                    {/* 點擊臨打訂單摘要可查看所報名的活動 */}
                                    <div
                                        role={canOpenPickUpDetail ? "button" : undefined}
                                        tabIndex={canOpenPickUpDetail ? 0 : undefined}
                                        aria-label={canOpenPickUpDetail ? translate("查看{value0}臨打團詳細資訊", { value0: order.title }) : undefined}
                                        onKeyDown={canOpenPickUpDetail ? (event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                openPickUpDetail(order);
                                            }
                                        } : undefined}
                                        className={canOpenPickUpDetail ? "cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500" : ""}
                                    >
                                    <div className="flex justify-between items-start mb-3 gap-3">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-900 break-words">
                                                {!isPickupOrder
                                                    ? `${order.location?.name} ${order.resource ? `- ${order.resource.name}` : ""}`
                                                    : `${order.title}`}
                                            </h2>
                                            {activeTab === "history" && <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{isPickupOrder ? t("臨打團") : t("場地預約")}</span>}
                                            {isPickupOrder && <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                                {partyDetails ? translate("團體報名 · {value0} 人", { value0: partyDetails.partySize }) : t("個人報名")}
                                            </span>}
                                            <OrderSportTag order={order} />
                                            {startingSoon && (
                                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{t("即將開始 · 24 小時內")}</span>
                                            )}
                                        </div>
                                        <div className={`shrink-0 px-3 py-1 rounded-md font-bold text-white font-medium ${statusMap[order.status]?.class || ""}`}>
                                            {getStatusLabel(order.status, t)}
                                        </div>
                                    </div>

                                    {/* 詳細資訊 */}
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p>{t("日期：")}{start.date}</p>
                                        <p>{t("時間：")}{start.time} - {end.time}</p>
                                        <p>{t("地點：")}{order.location?.name || t("未指定")}</p>
                                    </div>
                                    {canOpenPickUpDetail && <p className="mb-3 text-sm font-semibold text-blue-600">{t("點擊查看臨打團詳細資訊 →")}</p>}
                                    </div>
                                    {order.detailsUnavailable && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("活動資訊暫時無法取得，請稍後重新載入。")}</p>}
                                    {partyDetails && <PickUpPartyInfo details={partyDetails} />}
                                    {activeTab === "pickup" && !order.detailsUnavailable && order.status === "confirmed" && (
                                        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${pickupCancellationClosed
                                            ? "bg-amber-50 font-semibold text-amber-900"
                                            : "bg-blue-50 text-blue-800"}`}>
                                            {pickupCancellationClosed
                                                ? t("距離活動開始不到 24 小時，已無法取消報名。")
                                                : t("活動開始前 24 小時內將無法取消報名。")}
                                        </p>
                                    )}

                                    {/* 按鈕區塊 */}
                                    <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                        {directionsUrl && (
                                            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto">
                                                <MapPinned size={16} aria-hidden="true" />{t("Google Maps 導航")}
                                            </a>
                                        )}
                                        {activeTab !== "history" && !order.detailsUnavailable && !pickupCancellationClosed && !cancellingIds.has(order.id) && !["cancelled", "cancel_request", "cancelled_request"].includes(order.status) && !order._cancelRequested && (
                                            <button
                                                className="w-full sm:w-auto border border-red-500 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold py-2 px-6 rounded-lg transition"
                                                onClick={(event) => { event.stopPropagation(); openCancelModal(order); }}
                                            >
                                                {t("取消預約")}
                                            </button>
                                        )}
                                    </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            {/* {確認要刪除彈窗} */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeCancelModal} />

                    <div className="relative w-[92%] max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">{t("確認取消預約？")}</h2>
                        <p className="mt-2 text-gray-600">
                            {t("你確定要取消「")}{selectedCancelOrder?.ordereName || ""}{t("」這筆預約嗎？")}
                        </p>
                        <div className="mt-1 text-sm text-gray-500">
                            <p>{t("日期：")}{cancelStart.date}</p>
                            <p>{t("時間：")}{cancelStart.time} - {cancelEnd.time}</p>
                        </div>
                        {cancelActionError && <p role="alert" className="mt-3 text-sm text-red-600">{t("取消申請失敗：")}{describeRequestError(cancelActionError).message}</p>}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                                onClick={closeCancelModal}
                            >
                                {t("先不要")}
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700"
                                onClick={confirmCancel}
                                disabled={cancellingIds.has(selectedCancelOrder?.id)}
                            >
                                {cancellingIds.has(selectedCancelOrder?.id) ? t("送出中...") : t("確認取消")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedPickUpGroup && <div
                role="presentation"
                className="fixed inset-0 z-[60] flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-6"
                onMouseDown={() => setSelectedPickUpGroup(null)}
            >
                <PickUpDetailPopUp
                    selectedGroup={selectedPickUpGroup}
                    closeDetailModal={() => setSelectedPickUpGroup(null)}
                    onContactHost={handleContactHost}
                    registrationClosed={isRegistrationClosed(selectedPickUpGroup, now)}
                    hideJoin
                />
            </div>}
            {/* 重新載入按鈕 */}
            <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="fixed bottom-4 right-4 z-50 flex items-center justify-center gap-2 bg-gray-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
                <div>{functionIconMap.refresh.icon}</div>
                <span className="font-bold tracking-wider">{t("pickUpPage.button.refresh")}</span>
            </button>
        </div>
    )
}
