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
import { useAuthStore } from "../../store/authStore";

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
    const name = (typeof sport === "object" ? sport?.name : null) || (sportIconMap[code]?.labelKey && t(sportIconMap[code].labelKey));
    if (!name) return null;

    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm font-normal text-gray-600">
            {sportIconMap[code]?.icon}
            {name}
        </span>
    );
}

const genderLabels = { male: "common.gender.male", female: "common.gender.female", other: "common.gender.other" };

function PickUpPartyInfo({ details }) {
  const t = useTranslation();
    return <section aria-label={t("orderPage.accessibility.registrationInfo")} className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-blue-800">{t("orderPage.headings.registration")} {details.partySize} {t("orderPage.headings.peoplePeople")}</h3>
        </div>
        <p className="mt-3 font-semibold text-slate-700">{t("orderPage.messages.memberData")}</p>
        {details.members.length > 0 ? <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {details.members.map((member, index) => <li key={index} className="rounded-lg border border-blue-100 bg-white p-3">
                <p className="font-semibold text-slate-900">{t("orderPage.messages.number")} {index + 1} {t("orderPage.messages.placesSeparator")} {index === 0 ? t("orderPage.messages.people") : translate("orderPage.messages.memberName", { value0: index })}</p>
                <p className="mt-1 text-slate-600">{t("orderPage.messages.genderGender", { gender: t(genderLabels[member?.gender] || "common.messages.notProvided") })}</p>
                <p className="text-slate-600">{t("orderPage.messages.level")}{member?.skill_level !== null && member?.skill_level !== undefined && member?.skill_level !== ""
                    ? member.skill_level : t("common.messages.notProvided")}</p>
            </li>)}
        </ol> : <p className="mt-2 text-slate-500">{t("orderPage.messages.itemsOrderNotYetProvideMemberData")}</p>}
        {details.members.length > 0 && details.members.length < details.partySize &&
            <p className="mt-2 text-slate-500">{t("orderPage.messages.remaining")} {details.partySize - details.members.length} {t("orderPage.messages.memberDataNotYetProvide")}</p>}
    </section>;
}

export default function OrderPage({ historyOnly = false }) {
  const t = useTranslation();
    const userId = useAuthStore((state) => state.userId);
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
    }, [refreshTrigger, userId]);

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
            <Loading isLoading={loading} text={t("orderPage.messages.orderData")} />
            {(activeTab === "history" ? ["pickup", "booking"] : [activeTab]).map((kind) => loadErrors[kind] &&
                <p key={kind} role="alert" className="mx-auto mb-3 w-[95%] max-w-3xl rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {t("orderPage.errors.loadOrdersFailed", {
                        type: t(kind === "pickup" ? "orderPage.orderTypes.pickup" : "orderPage.orderTypes.booking"),
                        message: describeRequestError(loadErrors[kind]).message,
                    })}
                </p>)}
            {!loading && orders &&
                (
                    <div>
                        <h1 className="text-3xl font-bold text-center my-8">{historyOnly ? t("orderPage.headings.booking") : t("common.headings.myBookings")}</h1>

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
                                    {t("orderPage.actions.pickupGroup")}
                                </button>

                                <button
                                    className={`w-24 sm:w-32 py-2 text-center rounded-md transition-all duration-200 text-sm sm:text-base font-bold ${activeTab === "booking"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    onClick={() => setActiveTab("booking")}
                                >
                                    {t("orderPage.actions.title")}
                                </button>

                            </div>
                        </div>}

                        {/* Order List */}
                        {visibleOrders.length === 0 && !loadErrors[activeTab] && !(activeTab === "history" && (loadErrors.pickup || loadErrors.booking)) && (
                            <p className="mx-auto w-[95%] rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-gray-500 md:w-[50%]">
                                {activeTab === "history" ? t("orderPage.messages.currentNoneBooking") : t("orderPage.messages.currentNoneInProgressOrUpcomingStartBooking")}
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
                                        aria-label={canOpenPickUpDetail ? translate("orderPage.accessibility.viewPickupDetails", { value0: order.title }) : undefined}
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
                                            {activeTab === "history" && <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{isPickupOrder ? t("orderPage.messages.pickupGroup") : t("orderPage.messages.title")}</span>}
                                            {isPickupOrder && <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                                {partyDetails ? translate("orderPage.messages.groupRegistrationCount", { value0: partyDetails.partySize }) : t("orderPage.messages.peopleRegistration")}
                                            </span>}
                                            <OrderSportTag order={order} />
                                            {startingSoon && (
                                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{t("orderPage.messages.upcomingStartHour")}</span>
                                            )}
                                        </div>
                                        <div className={`shrink-0 px-3 py-1 rounded-md font-bold text-white font-medium ${statusMap[order.status]?.class || ""}`}>
                                            {getStatusLabel(order.status, t)}
                                        </div>
                                    </div>

                                    {/* 詳細資訊 */}
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p>{t("orderPage.messages.date")}{start.date}</p>
                                        <p>{t("orderPage.messages.time")}{start.time} - {end.time}</p>
                                        <p>{t("orderPage.messages.location")}{order.location?.name || t("orderPage.messages.unspecified")}</p>
                                    </div>
                                    {canOpenPickUpDetail && <p className="mb-3 text-sm font-semibold text-blue-600">{t("orderPage.messages.clickViewPickupGroupDetailsInfo")}</p>}
                                    </div>
                                    {order.detailsUnavailable && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("orderPage.errors.infoTemporarilyCannotPleaseLaterReload")}</p>}
                                    {partyDetails && <PickUpPartyInfo details={partyDetails} />}
                                    {activeTab === "pickup" && !order.detailsUnavailable && order.status === "confirmed" && (
                                        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${pickupCancellationClosed
                                            ? "bg-amber-50 font-semibold text-amber-900"
                                            : "bg-blue-50 text-blue-800"}`}>
                                            {pickupCancellationClosed
                                                ? t("orderPage.errors.distanceStartHourAlreadyCannotCancelRegistration")
                                                : t("orderPage.errors.startHourCannotCancelRegistration")}
                                        </p>
                                    )}

                                    {/* 按鈕區塊 */}
                                    <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                        {directionsUrl && (
                                            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto">
                                                <MapPinned size={16} aria-hidden="true" />{t("orderPage.messages.googleMaps")}
                                            </a>
                                        )}
                                        {activeTab !== "history" && !order.detailsUnavailable && !pickupCancellationClosed && !cancellingIds.has(order.id) && !["cancelled", "cancel_request", "cancelled_request"].includes(order.status) && !order._cancelRequested && (
                                            <button
                                                className="w-full sm:w-auto border border-red-500 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold py-2 px-6 rounded-lg transition"
                                                onClick={(event) => { event.stopPropagation(); openCancelModal(order); }}
                                            >
                                                {t("orderPage.actions.cancelBooking")}
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
                        <h2 className="text-xl font-bold text-gray-900">{t("orderPage.headings.confirmCancelBooking")}</h2>
                        <p className="mt-2 text-gray-600">
                            {t("orderPage.messages.yourCancel")}{selectedCancelOrder?.ordereName || ""}{t("orderPage.messages.itemsBooking")}
                        </p>
                        <div className="mt-1 text-sm text-gray-500">
                            <p>{t("orderPage.messages.date")}{cancelStart.date}</p>
                            <p>{t("orderPage.messages.time")}{cancelStart.time} - {cancelEnd.time}</p>
                        </div>
                        {cancelActionError && <p role="alert" className="mt-3 text-sm text-red-600">{t("orderPage.errors.cancelApplyFailed")}{describeRequestError(cancelActionError).message}</p>}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                                onClick={closeCancelModal}
                            >
                                {t("orderPage.actions.notNow")}
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700"
                                onClick={confirmCancel}
                                disabled={cancellingIds.has(selectedCancelOrder?.id)}
                            >
                                {cancellingIds.has(selectedCancelOrder?.id) ? t("common.actions.submitting") : t("orderPage.actions.confirmCancel")}
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
