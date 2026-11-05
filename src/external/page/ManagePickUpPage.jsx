import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarDays, ClipboardList, PencilLine, Phone, RefreshCw, Users } from "lucide-react";
import Navbar from "../components/navbar";
import { getUserProfile } from "../../service/userService";
import { pickUpService } from "../../service/pickUpService";
import { useAuthStore } from "../../store/authStore";
import { useSportStore } from "../../store/sportStore";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { describeRequestError } from "../../utils/requestError";
import { errorPopup, successPopup } from "../../components/pop-up";
import { useTranslation } from "../../locale/i18n";
import { functionIconMap } from "../../constant/IconMap";
import { getStatusLabel } from "../../constant/statusMap";

const statusOptions = ["pending", "confirmed", "cancel_request", "cancelled", "rejected"];
const paymentOptions = [["pending", "待付款"], ["done", "已付款"], ["failed", "付款失敗"]];
const statusLabel = (value, options) => options.find(([key]) => key === value)?.[1] || value || "未提供";
const memberGender = { female: "女性", male: "男性", other: "其他" };
const orderStatusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-green-200 bg-green-50 text-green-800",
  cancel_request: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  rejected: "border-red-300 bg-red-100 text-red-800",
};
const paymentStatusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  done: "border-green-200 bg-green-50 text-green-800",
  failed: "border-red-200 bg-red-50 text-red-800",
};

function StatusBadge({ status, payment = false }) {
  const t = useTranslation();
  const colors = payment ? paymentStatusClasses : orderStatusClasses;
  const label = payment ? t(statusLabel(status, paymentOptions)) : status ? getStatusLabel(status, t) : t("未提供");
  return <span className={`inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-xs font-bold ${colors[status] || "border-slate-200 bg-slate-100 text-slate-700"}`}>{label}</span>;
}

function OrderCard({ order, saving, onSave, editable = true, onManage }) {
  const t = useTranslation();
  const [status, setStatus] = useState(order.status || "pending");
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || "pending");
  useEffect(() => {
    setStatus(order.status || "pending");
    setPaymentStatus(order.payment_status || "pending");
  }, [order.status, order.payment_status]);

  const name = order.booker_name || order.organizer_name || t("未提供姓名");
  const changes = {
    ...(status !== order.status ? { status } : {}),
    ...(paymentStatus !== order.payment_status ? { payment_status: paymentStatus } : {}),
  };
  const hasChanges = Object.keys(changes).length > 0;
  const members = Array.isArray(order.members) ? order.members : [];
  const partySize = Number(order.party_size) > 0 ? Number(order.party_size) : Math.max(1, members.length);
  const createdAt = formatDateTime(order.created_at);

  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h3 className="min-w-0 break-words text-lg font-bold text-slate-900">{name}</h3>
      {onManage && <button type="button" onClick={() => onManage(order.id)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><PencilLine size={15} aria-hidden="true" />{t("管理")}</button>}
    </div>

    <div className="mt-2.5 space-y-1.5 text-sm text-slate-600">
      <p className="flex items-center gap-2"><Phone size={15} aria-hidden="true" className="shrink-0 text-slate-400" />{order.booker_phone ? <a className="font-medium text-blue-700 hover:underline" href={`tel:${order.booker_phone}`}>{order.booker_phone}</a> : t("聯絡電話未提供")}</p>
      <p className="flex items-center gap-2"><CalendarClock size={15} aria-hidden="true" className="shrink-0 text-slate-400" /><span>{createdAt.fullDate} {createdAt.time} {t("報名")}</span></p>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      {partySize > 1 && <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{t("團體報名 · {value0} 人", { value0: partySize })}</span>}
      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{t("程度")}：{order.skill_level?.label || order.skill_level?.name || order.skill_level || t("未提供")}</span>
      <StatusBadge status={order.status} />
      <StatusBadge status={order.payment_status} payment />
    </div>

    {partySize > 1 && <div className="mt-3 border-t border-slate-100 pt-3 text-xs">
      <p className="font-semibold text-slate-600">{t("同行成員")}</p>
      {members.length > 0 ? <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {members.map((member, index) => <li key={index} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-700">
          <span className="font-semibold">{index === 0 ? t("報名者") : t("成員 {value0}", { value0: index + 1 })}</span>
          <span className="ml-2">{t(memberGender[member.gender] || "性別未提供")}</span>
          <span className="ml-2">{t("程度")}: {member.skill_level?.label || member.skill_level || t("未提供")}</span>
        </li>)}
      </ol> : <p className="mt-1 text-slate-500">{t("此訂單尚未提供成員資料。")}</p>}
    </div>}

    {editable && <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-sm font-semibold text-slate-700">{t("報名狀態")}
        <select value={status} disabled={saving} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900">
          {statusOptions.map((value) => <option key={value} value={value}>{getStatusLabel(value, t)}</option>)}
          {!statusOptions.includes(status) && <option value={status}>{status}</option>}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">{t("付款狀態")}
        <select value={paymentStatus} disabled={saving} onChange={(event) => setPaymentStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900">
          {paymentOptions.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          {!paymentOptions.some(([value]) => value === paymentStatus) && <option value={paymentStatus}>{paymentStatus}</option>}
        </select>
      </label>
      <button type="button" disabled={!hasChanges || saving} onClick={() => onSave(order.id, changes)} className="min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? t("儲存中…") : t("儲存變更")}
      </button>
    </div>}
    {editable && hasChanges && ["cancelled", "rejected"].includes(status) && status !== order.status && <p className="mt-2 text-xs text-amber-800">{t("儲存後會釋放這筆報名占用的名額。")}</p>}
  </article>;
}

function OrderManageDialog({ order, saving, error, onClose, onSave }) {
  const t = useTranslation();
  const [status, setStatus] = useState(order.status || "pending");
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || "pending");
  const changes = {
    ...(status !== order.status ? { status } : {}),
    ...(paymentStatus !== order.payment_status ? { payment_status: paymentStatus } : {}),
  };
  const hasChanges = Object.keys(changes).length > 0;
  const submit = async (event) => {
    event.preventDefault();
    if (!hasChanges || saving) return;
    if (await onSave(order.id, changes)) onClose();
  };

  return <div className="pickup-modal-backdrop-enter fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !saving) onClose();
  }}>
    <section role="dialog" aria-modal="true" aria-label={t("管理報名狀態")} className="pickup-modal-panel-enter max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t("管理報名狀態")}</h2>
          <p className="mt-1 break-words text-sm text-slate-600">{order.booker_name || order.organizer_name || t("未提供姓名")}</p>
        </div>
        <button type="button" aria-label={t("關閉")} disabled={saving} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-50">{functionIconMap.cancel.icon}</button>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">{t("報名狀態")}
          <select value={status} disabled={saving} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900">
            {statusOptions.map((value) => <option key={value} value={value}>{getStatusLabel(value, t)}</option>)}
            {!statusOptions.includes(status) && <option value={status}>{status}</option>}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">{t("付款狀態")}
          <select value={paymentStatus} disabled={saving} onChange={(event) => setPaymentStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900">
            {paymentOptions.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            {!paymentOptions.some(([value]) => value === paymentStatus) && <option value={paymentStatus}>{paymentStatus}</option>}
          </select>
        </label>
        {hasChanges && ["cancelled", "rejected"].includes(status) && status !== order.status && <p className="text-xs text-amber-800">{t("儲存後會釋放這筆報名占用的名額。")}</p>}
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 disabled:opacity-50">{t("取消")}</button>
          <button type="submit" disabled={!hasChanges || saving} className="min-h-11 rounded-lg bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t("儲存中…") : t("儲存變更")}</button>
        </div>
      </form>
    </section>
  </div>;
}

function GroupOrderDetails({ group, orders, loading, error, actionError, editable, savingId, onSave, onRetry, onManage }) {
  const t = useTranslation();
  if (!group) return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">{t("選擇一個活動查看報名者。")}</p>;
  return <div className="min-w-0 space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <ClipboardList className="text-blue-600" size={24} />
        <h2 className="min-w-0 break-words text-xl font-bold">{group.title || t("未命名活動")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">{formatDateTime(group.start_time).fullDate} {formatDateTime(group.start_time).time}–{formatDateTime(group.end_time).time}</p>
      {!loading && !error && <p className="mt-2 text-sm font-semibold text-blue-800">{t("報名訂單")}：{orders?.length ?? "—"}</p>}
    </div>
    {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}
    {loading && <p role="status" className="rounded-xl bg-white p-5 text-slate-600">{t("載入報名者資料中…")}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={onRetry} className="ml-2 font-semibold underline">{t("重試")}</button></p>}
    {!loading && !error && orders === null && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("此活動的報名清單未由 API 提供，暫時無法管理報名者。")}</p>}
    {!loading && !error && orders?.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">{t("目前還沒有報名訂單。")}</p>}
    {!loading && !error && orders?.map((order) => <OrderCard key={`${order.id}-${editable}`} order={order} editable={editable} saving={savingId === order.id} onSave={onSave} onManage={onManage} />)}
  </div>;
}

function ManagePickUpContent({ sportId }) {
  const t = useTranslation();
  const userId = useAuthStore((state) => state.userId);
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const loadMoreInFlight = useRef(false);
  const loadGeneration = useRef(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRetry, setDetailRetry] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [managingOrderId, setManagingOrderId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia?.("(max-width: 1023px)")?.matches || false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 1023px)");
    if (!query) return;
    const update = () => setIsMobile(query.matches);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEscape = (event) => {
      if (event.key !== "Escape" || savingId) return;
      if (managingOrderId) setManagingOrderId(null);
      else setMobileSheetOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isMobile, mobileSheetOpen, savingId, managingOrderId]);

  useEffect(() => {
    let active = true;
    loadGeneration.current += 1;
    loadMoreInFlight.current = false;
    setLoadingMore(false);
    setLoading(true);
    setError("");
    setGroups([]);
    setCursor(null);
    setHasMore(false);
    setSelectedId(null);
    setDetailsById({});
    setMobileSheetOpen(false);
    setManagingOrderId(null);
    Promise.resolve().then(async () => {
      const profile = await getUserProfile();
      const currentUser = { ...profile, id: profile?.id || userId };
      const firstPage = await pickUpService.getHostedPickUpGroupsPage(sportId, currentUser);
      return { currentUser, firstPage };
    }).then(({ currentUser, firstPage }) => {
      if (!active) return;
      setUser(currentUser);
      setGroups(firstPage.items);
      setCursor(firstPage.cursor);
      setHasMore(firstPage.hasMore);
    }).catch((failure) => {
      if (!active) return;
      setGroups([]);
      setError(describeRequestError(failure).message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sportId, userId, refresh]);

  const loadMore = async () => {
    if (!hasMore || !user || loadMoreInFlight.current) return;
    const generation = loadGeneration.current;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const next = await pickUpService.getHostedPickUpGroupsPage(sportId, user, cursor);
      if (generation !== loadGeneration.current) return;
      setGroups((previous) => {
        const known = new Set(previous.map((group) => group.id));
        return [...previous, ...next.items.filter((group) => !known.has(group.id))];
      });
      setCursor(next.cursor);
      setHasMore(next.hasMore);
    } catch (failure) {
      if (generation === loadGeneration.current) setLoadMoreError(describeRequestError(failure).message);
    } finally {
      if (generation === loadGeneration.current) {
        loadMoreInFlight.current = false;
        setLoadingMore(false);
      }
    }
  };

  const selectGroup = (groupId) => {
    setSelectedId(groupId);
    setActionError("");
    setDetailError("");
    setManagingOrderId(null);
    if (detailError && !detailsById[groupId]) setDetailRetry((value) => value + 1);
    if (isMobile) setMobileSheetOpen(true);
  };

  useEffect(() => {
    if (!selectedId || !user || detailsById[selectedId]) return;
    const summary = groups.find((group) => group.id === selectedId);
    if (!summary) return;
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    pickUpService.getHostedPickUpDetail(summary, user).then((detail) => {
      if (active) setDetailsById((previous) => ({ ...previous, [selectedId]: detail }));
    }).catch((failure) => {
      if (active) setDetailError(describeRequestError(failure).message);
    }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId, user, detailRetry, groups, detailsById]);

  const selectedSummary = groups.find((group) => group.id === selectedId);
  const selectedGroup = detailsById[selectedId] || selectedSummary;
  const detailPending = Boolean(selectedId && !detailsById[selectedId] && !detailError);
  const orders = Array.isArray(selectedGroup?.orders) ? selectedGroup.orders : null;
  const managingOrder = orders?.find((order) => order.id === managingOrderId);
  const sortedGroups = groups
    .filter((group) => new Date(group.start_time).getTime() > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const saveOrder = async (orderId, changes) => {
    if (!selectedGroup || !user || savingId) return;
    const groupId = selectedGroup.id;
    setSavingId(orderId);
    setActionError("");
    try {
      const updatedOrder = await pickUpService.updatePickUpOrder(orderId, changes);
      setDetailsById((previous) => ({ ...previous, [groupId]: {
        ...previous[groupId],
        orders: previous[groupId]?.orders?.map((order) => order.id === orderId
          ? { ...order, ...changes, ...(updatedOrder?.id ? updatedOrder : {}) } : order),
      } }));
      try {
        const detail = await pickUpService.getHostedPickUpDetail(selectedSummary, user);
        setDetailsById((previous) => ({ ...previous, [groupId]: {
          ...previous[groupId], ...detail,
          orders: Array.isArray(detail.orders) ? detail.orders : previous[groupId]?.orders,
        } }));
        setGroups((previous) => previous.map((group) => group.id === groupId
          ? { ...group, current_enrolled: detail.current_enrolled ?? group.current_enrolled } : group));
      } catch {
        // PATCH 已成功，保留更新後的訂單；重新整理可再取得最新名額。
      }
      successPopup(t("更新成功"), t("報名狀態已更新。"));
      return true;
    } catch (failure) {
      const feedback = describeRequestError(failure);
      setActionError(feedback.message);
      errorPopup(feedback.title, feedback.message);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  return <div className="app-page min-h-screen pb-16 text-slate-900">
    <Navbar />
    <main className="mx-auto w-[95%] max-w-7xl pt-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("管理臨打團")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("查看目前球類中你建立的活動與報名者，並更新報名或付款狀態。")}</p>
        </div>
        <button type="button" disabled={loading || Boolean(savingId)} onClick={() => { setActionError(""); setRefresh((value) => value + 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={17} />{t("重新整理")}
        </button>
      </div>

      {loading && <p role="status" className="rounded-xl bg-white p-6 text-slate-600">{t("載入你建立的臨打團中…")}</p>}
      {!loading && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-3 font-semibold underline">{t("重試")}</button></div>}
      {!loading && !error && sortedGroups.length === 0 && !hasMore && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Users className="mx-auto text-blue-600" size={30} />
        <p className="mt-3 font-semibold">{t("你目前沒有即將開始的臨打團。")}</p>
        <Link to="/external/pickup" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700">{t("返回臨打團")}</Link>
      </div>}

      {!loading && !error && sortedGroups.length === 0 && hasMore && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-slate-600">{t("繼續載入更多活動。")}</p>
        <button type="button" disabled={loadingMore} onClick={loadMore} className="mt-3 min-h-10 rounded-lg bg-blue-600 px-4 font-semibold text-white disabled:opacity-50">{loadingMore ? t("載入中…") : t("載入更多")}</button>
      </div>}

      {!loading && !error && sortedGroups.length > 0 && <div className="grid gap-5 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:self-start">
          <h2 className="px-2 py-2 font-bold text-slate-900">{t("我的活動")} <span className="text-sm font-normal text-slate-500">({sortedGroups.length})</span></h2>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto px-1 pb-1" onScroll={(event) => {
            const list = event.currentTarget;
            if (list.scrollTop + list.clientHeight >= list.scrollHeight - 80) loadMore();
          }}>
            {sortedGroups.map((group) => {
              const isSoon = new Date(group.start_time).getTime() - now < 48 * 60 * 60 * 1000;
              const isSelected = selectedId === group.id;
              return <button key={group.id} type="button" aria-pressed={isSelected} onClick={() => selectGroup(group.id)}
                className={`relative w-full rounded-xl border px-4 py-4 text-left shadow-sm transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSoon ? "border-amber-300 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-50" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"} ${isSelected ? "ring-2 ring-blue-200 shadow-md" : "hover:shadow-md"}`}>
                {isSoon && <span className="absolute right-3 top-3 rounded-md bg-amber-200 px-2 py-1 text-xs font-bold text-amber-950">{t("快開始了")}</span>}
                <span className={`block break-words font-semibold leading-6 text-slate-900 ${isSoon ? "pr-20" : ""}`}>{group.title || t("未命名活動")}</span>
                <span className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={15} aria-hidden="true" className="shrink-0 text-slate-400" />{formatDateTime(group.start_time).fullDate} · {formatDateTime(group.start_time).time}</span>
              </button>;
            })}
            {hasMore && <button type="button" disabled={loadingMore} onClick={loadMore} className="min-h-10 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">{loadingMore ? t("載入中…") : t("載入更多")}</button>}
            {loadMoreError && <p role="alert" className="px-2 text-sm text-red-600">{loadMoreError}</p>}
          </div>
        </aside>

        {!isMobile && <section className="min-w-0">
          <GroupOrderDetails group={selectedGroup} orders={orders} loading={detailLoading || detailPending} error={detailError} actionError={actionError} editable savingId={savingId} onSave={saveOrder} onRetry={() => setDetailRetry((value) => value + 1)} />
        </section>}
      </div>}

      {isMobile && mobileSheetOpen && selectedSummary && <div className="manage-pickup-backdrop-enter fixed inset-0 z-[80] bg-slate-950/50" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !savingId) setMobileSheetOpen(false);
      }}>
        <section role="dialog" aria-modal="true" aria-label={t("成員清單")} className="manage-pickup-sheet-enter absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-white shadow-2xl">
          <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-2">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">{t("成員清單")}</h2>
              <button type="button" aria-label={t("關閉")} disabled={Boolean(savingId)} onClick={() => setMobileSheetOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-50">{functionIconMap.cancel.icon}</button>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <GroupOrderDetails group={selectedGroup} orders={orders} loading={detailLoading || detailPending} error={detailError} actionError={managingOrderId ? "" : actionError} editable={false} savingId={savingId} onSave={saveOrder} onRetry={() => setDetailRetry((value) => value + 1)} onManage={(orderId) => { setActionError(""); setManagingOrderId(orderId); }} />
          </div>
        </section>
        {managingOrder && <OrderManageDialog key={managingOrder.id} order={managingOrder} saving={savingId === managingOrder.id} error={actionError} onClose={() => setManagingOrderId(null)} onSave={saveOrder} />}
      </div>}
    </main>
  </div>;
}

export default function ManagePickUpPage() {
  const t = useTranslation();
  const sportId = useSportStore((state) => state.sportId);
  if (!sportId) return <div className="app-page min-h-screen"><Navbar /><p className="mx-auto w-[95%] max-w-7xl py-8 text-slate-600">{t("載入球類資料中...")}</p></div>;
  return <ManagePickUpContent key={sportId} sportId={sportId} />;
}
