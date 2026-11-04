import { getLocale, useTranslation, translate } from "../../../locale/i18n";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, Check, CheckCheck, ChevronDown, ClipboardList, Clock3, CreditCard, MapPin, Star, UserRound } from "lucide-react";
import { pickUpService } from "../../../service/pickUpService";
import { locationService } from "../../../service/locationService";
import { formatDateTime } from "../../../utils/dateTimeFormat";
import { describeRequestError } from "../../../utils/requestError";

const typeLabels = {
  pickup_order_created: "pickupOrderCreated",
  pickup_order_confirmed: "pickupOrderConfirmed",
  pickup_order_rejected: "pickupOrderRejected",
  pickup_order_cancelled: "pickupOrderCancelled",
  pickup_order_cancelled_by_host: "pickupOrderCancelledByHost",
  pickup_order_cancel_requested: "pickupOrderCancelRequested",
  pickup_payment_updated: "pickupPaymentUpdated",
  pickup_group_updated: "pickupGroupUpdated",
  pickup_group_cancelled: "pickupGroupCancelled",
  skill_rated: "skillRated",
};
const groupStatuses = { active: "active", cancelled: "cancelled", completed: "completed" };
const orderStatuses = { pending: "pending", confirmed: "confirmed", cancelled: "cancelled", cancel_request: "cancelRequest", rejected: "rejected" };
const paymentStatuses = { pending: "pending", done: "done", failed: "failed" };

export function formatNotificationDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return translate("notificationPage.card.dateUnavailable");
  const formatted = formatDateTime(value);
  return `${formatted.fullDate} ${formatted.time}`;
}

function RelatedInfo({ notification }) {
  const t = useTranslation();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(Boolean(notification.pickup_group_id));
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const groupId = notification.pickup_group_id;
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const group = await pickUpService.getPickUpDetail(groupId);
        let location = group.location || null;
        let locationFailed = false;
        if (!location && group.location_id) {
          try { location = await locationService.getLocationInfo(group.location_id); }
          catch { locationFailed = true; }
        }
        const order = group.orders?.find((item) => item.id === notification.pickup_order_id);
        if (!cancelled) setDetails({ group, location, locationFailed, order });
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.status === 404
          ? t("notificationPage.relatedInfo.groupUnavailable") : describeRequestError(requestError).message);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [groupId, notification.pickup_order_id, retry, t]);

  return <div className="space-y-4 rounded-xl bg-slate-50 p-4 text-sm">
    {loading && <p role="status" className="text-slate-500">{t("notificationPage.relatedInfo.loading")}</p>}
    {error && <div role="alert" className="text-red-600">
      <p>{error}</p>
      <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-2 font-medium underline">{t("notificationPage.relatedInfo.reload")}</button>
    </div>}
    {!loading && !error && details && <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-900">{details.group.title || t("notificationPage.relatedInfo.groupTitleFallback")}</h3>
        {details.group.sport?.name && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{details.group.sport.name}</span>}
        {groupStatuses[details.group.status] && <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-600">{t(`notificationPage.relatedInfo.groupStatus.${groupStatuses[details.group.status]}`)}</span>}
      </div>
      <p className="text-xs text-slate-500">{t("notificationPage.relatedInfo.currentInfo")}</p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={15} />{t("notificationPage.relatedInfo.eventTime")}</dt>
          <dd className="mt-1 text-slate-700">{formatNotificationDate(details.group.start_time)}</dd>
          {details.group.end_time && <dd className="mt-1 text-xs text-slate-500">{t("notificationPage.relatedInfo.endsAt", { time: formatNotificationDate(details.group.end_time) })}</dd>}
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={15} />{t("notificationPage.relatedInfo.location")}</dt>
          <dd className="mt-1 break-words text-slate-700">{details.location?.name || (details.locationFailed ? t("notificationPage.relatedInfo.locationLoadFailed") : t("notificationPage.relatedInfo.locationUnavailable"))}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-slate-500"><UserRound size={15} />{t("notificationPage.relatedInfo.host")}</dt>
          <dd className="mt-1 text-slate-700">{details.group.host?.display_name || details.group.host?.username || t("notificationPage.relatedInfo.unavailable")}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t("notificationPage.relatedInfo.fee")}</dt>
          <dd className="mt-1 font-semibold text-green-700">{typeof details.group.fee === "number" ? new Intl.NumberFormat(getLocale(), { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(details.group.fee) : t("notificationPage.relatedInfo.unavailable")}</dd>
        </div>
      </dl>
      {details.order && <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
        <span>{t("notificationPage.relatedInfo.orderStatus", { status: orderStatuses[details.order.status] ? t(`notificationPage.relatedInfo.registrationStatus.${orderStatuses[details.order.status]}`) : t("notificationPage.relatedInfo.unavailable") })}</span>
        <span>{t("notificationPage.relatedInfo.paymentStatus", { status: paymentStatuses[details.order.payment_status] ? t(`notificationPage.relatedInfo.paymentState.${paymentStatuses[details.order.payment_status]}`) : t("notificationPage.relatedInfo.unavailable") })}</span>
        {Number.isInteger(details.order.party_size) && <span>{t("notificationPage.relatedInfo.partySize", { count: details.order.party_size })}</span>}
      </div>}
    </>}
    {notification.pickup_order_id && <div className="border-t border-slate-200 pt-3">
      <p className="text-xs text-slate-500">{t("notificationPage.relatedInfo.orderId")}</p>
      <p className="mt-1 break-all text-xs text-slate-600">{notification.pickup_order_id}</p>
    </div>}
    <div className="flex flex-wrap gap-4 text-sm font-medium text-blue-600">
      {groupId && <Link className="hover:underline" to="/external/pickup">{t("notificationPage.relatedInfo.openGroups")}</Link>}
      {notification.pickup_order_id && <Link className="hover:underline" to="/external/order">{t("notificationPage.relatedInfo.openOrders")}</Link>}
    </div>
  </div>;
}

export default function NotificationCard({ notification, onMarkRead, busy, marking }) {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const unread = !notification.is_read;
  const hasRelatedInfo = notification.pickup_group_id || notification.pickup_order_id;
  const Icon = notification.type === "skill_rated" ? Star
    : notification.type === "pickup_payment_updated" ? CreditCard
      : notification.type?.startsWith("pickup_group_") ? CalendarDays
        : notification.pickup_order_id ? ClipboardList : Bell;
  const regionId = `notification-details-${notification.id}`;
  return <article className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${unread ? "border-blue-200" : "border-slate-200"}`}>
    <div className="flex items-start gap-3 sm:gap-4">
      <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${unread ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">{t(`notificationPage.card.type.${typeLabels[notification.type] || "system"}`)}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${unread ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{t(unread ? "notificationPage.card.status.unread" : "notificationPage.card.status.read")}</span>
        </div>
        <h2 className="mt-2 break-words text-base font-semibold text-slate-900">{notification.title || t("notificationPage.card.defaultTitle")}</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{notification.content || t("notificationPage.card.emptyContent")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={14} aria-hidden="true" /><time dateTime={notification.created_at || undefined}>{formatNotificationDate(notification.created_at)}</time></span>
          <div className="flex flex-wrap items-center gap-2">
            {hasRelatedInfo && <button type="button" aria-expanded={expanded} aria-controls={regionId} onClick={() => setExpanded((value) => !value)} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              {t(expanded ? "notificationPage.card.actions.collapse" : "notificationPage.card.actions.expand")}<ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
            </button>}
            {unread ? <button type="button" disabled={busy} onClick={() => onMarkRead(notification.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-50">
              <Check size={16} />{t(marking ? "notificationPage.card.actions.marking" : "notificationPage.card.actions.markRead")}
            </button> : <span className="inline-flex items-center gap-1 px-2 text-xs text-slate-400"><CheckCheck size={15} />{t("notificationPage.card.status.viewed")}</span>}
          </div>
        </div>
      </div>
    </div>
    {expanded && <div id={regionId} className="mt-4"><RelatedInfo notification={notification} /></div>}
  </article>;
}
