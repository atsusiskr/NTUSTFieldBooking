import { bookingTimestamp } from "../../utils/bookingDateTime";

const STATUS_PRIORITY = { confirmed: 0, pending: 1, cancel_request: 2, cancelled_request: 2, cancelled: 3 };
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const startTime = (order, kind = order?.orderKind) => kind === "booking"
    ? bookingTimestamp(order?.start_time, order) : new Date(order?.start_time).getTime();
const endTime = (order, kind = order?.orderKind) => order?.end_time
    ? kind === "booking" ? bookingTimestamp(order.end_time, order) : new Date(order.end_time).getTime()
    : NaN;

export function isOrderExpired(order, now = Date.now(), kind = order?.orderKind) {
    const end = endTime(order, kind);
    return Number.isFinite(end) && end <= now;
}

export function getHistoricalOrders(bookingOrders = [], pickupOrders = [], now = Date.now()) {
    return [
        ...bookingOrders.map((order) => ({ ...order, orderKind: "booking" })),
        ...pickupOrders.map((order) => ({ ...order, orderKind: "pickup" })),
    ].filter((order) => isOrderExpired(order, now))
        .sort((a, b) => endTime(b) - endTime(a));
}

export function sortOrdersForDisplay(orders = [], now = Date.now(), kind) {
    return orders.map((order, index) => ({ order, index })).sort((a, b) => {
        const statusDiff = (STATUS_PRIORITY[a.order.status] ?? 4) - (STATUS_PRIORITY[b.order.status] ?? 4);
        if (statusDiff) return statusDiff;
        if (a.order.status === "confirmed") {
            const aStart = startTime(a.order, kind);
            const bStart = startTime(b.order, kind);
            const aUpcoming = Number.isFinite(aStart) && aStart > now;
            const bUpcoming = Number.isFinite(bStart) && bStart > now;
            if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
            if (aUpcoming && bUpcoming) return aStart - bStart || a.index - b.index;
            if (Number.isFinite(aStart) && Number.isFinite(bStart)) return bStart - aStart || a.index - b.index;
            if (Number.isFinite(aStart) !== Number.isFinite(bStart)) return Number.isFinite(aStart) ? -1 : 1;
        }
        return a.index - b.index;
    }).map(({ order }) => order);
}

export function getUpcomingConfirmedOrders(orders = [], now = Date.now()) {
    return orders.filter((order) => {
        const remaining = startTime(order) - now;
        return order.status === "confirmed" && Number.isFinite(remaining)
            && remaining > 0 && remaining < TWO_DAYS_MS;
    }).sort((a, b) => startTime(a) - startTime(b));
}
