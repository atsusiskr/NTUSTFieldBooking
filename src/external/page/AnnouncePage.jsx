import { useTranslation } from "../../locale/i18n";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Navbar from "../components/navbar";
import Loading from "../../components/loading";
import NotificationCard from "../components/notifications/NotificationCard";
import { notificationService } from "../../service/notificationService";
import { describeRequestError } from "../../utils/requestError";

const PAGE_SIZE = 20;

export function AnnouncePage() {
  const t = useTranslation();
    const [query, setQuery] = useState({ unreadOnly: false, page: 1 });
    const [result, setResult] = useState({ items: [], total: null, pageSize: PAGE_SIZE, hasNext: false });
    const [unreadCount, setUnreadCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [feedback, setFeedback] = useState("");
    const [pending, setPending] = useState(null);
    const mutationRef = useRef(false);
    const mountedRef = useRef(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        setLoading(true);
        setError("");
        async function load() {
            const [list, count] = await Promise.allSettled([
                notificationService.getList({ ...query, pageSize: PAGE_SIZE, signal: controller.signal }),
                notificationService.getUnreadCount({ signal: controller.signal }),
            ]);
            if (cancelled) return;
            if (count.status === "fulfilled") {
                setUnreadCount(count.value);
            } else {
                setUnreadCount(null);
            }
            if (list.status === "fulfilled") {
                const lastPage = list.value.total === null ? null : Math.max(1, Math.ceil(list.value.total / list.value.pageSize));
                if (lastPage !== null && query.page > lastPage) {
                    setQuery((current) => ({ ...current, page: lastPage }));
                    return;
                }
                if (lastPage === null && query.page > 1 && list.value.items.length === 0) {
                    setQuery((current) => ({ ...current, page: current.page - 1 }));
                    return;
                }
                setResult(list.value);
            } else {
                setError(describeRequestError(list.reason).message);
            }
            setLoading(false);
        }
        load();
        return () => { cancelled = true; controller.abort(); };
    }, [query, refresh]);

    async function markRead(id = null) {
        if (mutationRef.current) return;
        mutationRef.current = true;
        setPending(id || "all");
        setActionError("");
        setFeedback("");
        try {
            if (id) await notificationService.markRead(id);
            else await notificationService.markAllRead();
            if (!mountedRef.current) return;
            setFeedback(id ? t("通知已標記為已讀。") : t("全部通知已標記為已讀。"));
            setRefresh((value) => value + 1);
        } catch (error) {
            if (mountedRef.current) setActionError(describeRequestError(error).message);
        } finally {
            mutationRef.current = false;
            if (mountedRef.current) setPending(null);
        }
    }

    const pageCount = result.total === null ? null : Math.max(1, Math.ceil(result.total / result.pageSize));
    const visibleUnreadCount = result.items.filter((item) => !item.is_read).length;
    const busy = Boolean(pending);
    const changeFilter = (unreadOnly) => {
        setFeedback("");
        setActionError("");
        setQuery({ unreadOnly, page: 1 });
    };

    return <div className="app-page text-slate-900">
        <Navbar />
        <Loading isLoading={loading} text={t("正在載入通知…")} />
        <main className="mx-auto w-[92%] max-w-4xl py-8 sm:py-10">
            <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-xl border border-blue-100 bg-white text-blue-600"><Bell size={23} aria-hidden="true" /></span>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("我的通知")}</h1>
                        {!loading && !error && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{t("{count} 則未讀{scope}", { count: unreadCount ?? visibleUnreadCount, scope: unreadCount === null ? t("（此頁）") : "" })}</span>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading || busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} />{t("重新整理")}</button>
                    <button type="button" onClick={() => markRead()} disabled={loading || busy || unreadCount === 0} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><CheckCheck size={16} />{pending === "all" ? t("處理中…") : t("全部標為已讀")}</button>
                </div>
            </header>

            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200">
                <div className="flex gap-5" role="group" aria-label={t("通知篩選")}>
                    {[{ label: "全部通知", unreadOnly: false }, { label: "未讀通知", unreadOnly: true }].map((tab) => <button key={tab.label} type="button" aria-pressed={query.unreadOnly === tab.unreadOnly} disabled={busy} onClick={() => changeFilter(tab.unreadOnly)} className={`min-h-12 border-b-2 px-1 text-sm font-semibold disabled:opacity-50 ${query.unreadOnly === tab.unreadOnly ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t(tab.label)}</button>)}
                </div>
                {!loading && !error && result.total !== null && <span className="text-xs text-slate-400">{t("共 {count} 則", { count: result.total })}</span>}
            </div>
            <p role="status" className="mb-3 text-sm text-slate-500">{feedback}</p>
            {actionError && <p role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
            {!loading && error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-2 font-semibold underline">{t("重試")}</button></div>}
            {!loading && !error && result.items.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{query.unreadOnly ? t("目前沒有未讀通知。") : t("目前沒有通知。")}</p>}
            {!loading && !error && result.items.length > 0 && <div className="space-y-3">
                {result.items.map((notification) => <NotificationCard key={notification.id} notification={notification}
                    onMarkRead={markRead} busy={busy} marking={pending === notification.id} />)}
            </div>}

            {!loading && !error && (query.page > 1 || result.hasNext) && <nav aria-label={t("通知分頁")} className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-slate-500">{t("第 {page}{total} 頁", { page: query.page, total: pageCount === null ? "" : ` / ${pageCount}` })}</p>
                <div className="flex gap-2">
                    <button type="button" aria-label={t("上一頁")} disabled={busy || query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={16} />{t("上一頁")}</button>
                    <button type="button" aria-label={t("下一頁")} disabled={busy || !result.hasNext} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-40">{t("下一頁")}<ChevronRight size={16} /></button>
                </div>
            </nav>}
        </main>
    </div>;
}
