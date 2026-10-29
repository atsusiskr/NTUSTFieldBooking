import { useTranslation, translate } from "../../locale/i18n";
import { useState, useEffect } from "react";
import api from "../../baseApi"
import { bookingService } from "../../service/bookingService";
import Navbar from "../components/navbar";
import Loading from "../../components/loading";
import { formatBookingDateTime } from "../../utils/bookingDateTime";
import { describeRequestError } from "../../utils/requestError";

function OrderPage() {
  const t = useTranslation();
    const [orders, setOrders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedCancelOrder, setSelectedCancelOrder] = useState(null); // { id, resourceName, start, end }
    const [cancellingIds, setCancellingIds] = useState(() => new Set());
    const [cancelActionError, setCancelActionError] = useState(null);
    const [pdfImportError, setPdfImportError] = useState(null);
    const statusStyle = {
        pending: {
            label: "待審核",
            class: "bg-amber-100 text-amber-800 border border-amber-300",
        },
        confirmed: {
            label: "已確認",
            class: "bg-blue-100 text-blue-800 border border-blue-300",
        },
        cancelled: { 
            label: "已取消", 
            class: "bg-gray-100 text-gray-800 border border-gray-300" 
        },
        cancel_requested : {
            label: "取消申請中",
            class: "bg-red-100 text-red-800 border border-red-300"
        },
        cancelled_request: {
            label: "取消申請中",
            class: "bg-red-100 text-red-800 border border-red-300"
        }
    }
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/bookings");
                setOrders(res.data);
            }
            catch (err) { setError(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const openCancelModal = (order) => {
        setCancelActionError(null);
        setSelectedCancelOrder({
            id: order.id,
            resourceName: order.location.name + " - " + (order?.resource?.name ?? ""),
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

    const confirmCancel = async () => {
        if (!selectedCancelOrder?.id) return;
        const orderId = selectedCancelOrder.id;

        // mark as "cancelling" immediately for UI
        setCancellingIds((prev) => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
        });

        try {
            await bookingService.requestCancellation(orderId);
            setOrders((previous) => ({
                ...previous,
                items: previous.items.map((order) => order.id === orderId
                    ? { ...order, status: "cancelled_request" } : order),
            }));
            setCancelModalOpen(false);
            setSelectedCancelOrder(null);
            setCancelActionError(null);
        } catch (err) {
            setCancelActionError(err);
        } finally {
            setCancellingIds((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    const handlePdfImport = async (order, e) => {
        setPdfImportError(null);
        const file = e?.target?.files?.[0];
        if (!file) return;

        e.target.value = "";

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setPdfImportError(new Error(translate("請選擇 PDF 檔案")));
            return;
        }

        try {
            console.log("PDF selected for order:", order.id, file);
        } catch (err) {
            setPdfImportError(err);
        }
    };

    const statusPriority = {
        pending: 0,
        confirmed: 1,
        completed: 2,
        cancel_requested: 3,
        cancelled_request: 3,
        cancelled: 4,
    };

    const sortedItems = (orders?.items ? [...orders.items] : []).sort((a, b) => {
        const aEffectiveStatus = (cancellingIds.has(a.id) || a._cancelRequested) ? "cancel_requested" : a.status;
        const bEffectiveStatus = (cancellingIds.has(b.id) || b._cancelRequested) ? "cancel_requested" : b.status;

        const aP = statusPriority[aEffectiveStatus] ?? 99;
        const bP = statusPriority[bEffectiveStatus] ?? 99;
        if (aP !== bP) return aP - bP;

        // tie-breaker: earlier start_time first
        const aT = a?.start_time ? new Date(a.start_time).getTime() : 0;
        const bT = b?.start_time ? new Date(b.start_time).getTime() : 0;
        return aT - bT;
    });

    return (
        <div>
            <Navbar />
            <Loading isLoading={loading} text={t("取得訂單資料中...")} />
            {error && <p>{t("取得訂單資料失敗：")}{describeRequestError(error).message}</p>}
            {pdfImportError && <p className="text-red-600 text-center mt-2">{t("匯入 PDF 失敗:")} {pdfImportError.message}</p>}
            {!loading && orders &&
                (
                    <div>
                        <h1 class="text-3xl font-bold text-center my-8">{t("我的預約")}</h1>
                        <ul>
                            {sortedItems.map((order) => (
                                <li key={order.id} className={`flex flex-row sm:justify-between w-full md:w-[60%] h-[130px] mx-auto my-3 border border-blue-200 rounded-md ${order.status === "cancelled" ? "opacity-40" : ""}`}>
                                    <div className="flex flex-col justify-between p-4">
                                        <div className="flex justify-between gap-4">
                                            <p className="text-start text-2xl font-semibold ">
                                                {order.location.name} {order?.resource?.name ? `- ${order.resource.name}` : ""}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    id={`pdf-input-${order.id}`}
                                                    type="file"
                                                    accept="application/pdf,.pdf"
                                                    className="hidden"
                                                    onChange={(e) => handlePdfImport(order, e)}
                                                />
                                                <button
                                                    type="button"
                                                    className="hover:bg-blue-700 hover:text-white border-2 border-dashed border-blue-400 text-blue-400 font-semibold py-1 px-2 rounded-md whitespace-nowrap"
                                                    onClick={() => document.getElementById(`pdf-input-${order.id}`)?.click()}
                                                >
                                                    {t("上傳計畫書(.pdf)")}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-start text-md text-gray-400">{t("預約時間：")}{order.start_time ? `${formatBookingDateTime(order.start_time, order).date} ${formatBookingDateTime(order.start_time, order).time} - ${formatBookingDateTime(order.end_time, order).time}` : ""}</p>
                                    </div>

                                    <div className=" flex flex-col h-auto items-end justify-between p-4">
                                        <p className="text-lg font-semibold" >
                                            <span className={statusStyle[order.status].class +  " px-2 py-1 rounded-md ml-2 font-normal"}>
                                                {t(statusStyle[order.status].label)}
                                            </span>
                                        </p>
                                        {!cancellingIds.has(order.id) && !["cancelled", "cancel_requested", "cancelled_request"].includes(order.status) && !order._cancelRequested && (
                                            <button
                                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
                                                onClick={() => openCancelModal(order)}
                                            >
                                                {t("取消預約")}
                                            </button>
                                        )}

                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeCancelModal} />

                    <div className="relative w-[92%] max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">{t("確認取消預約？")}</h2>
                        <p className="mt-2 text-gray-600">
                            {t("你確定要取消「")}{selectedCancelOrder?.resourceName || ""}{t("」這筆預約嗎？")}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedCancelOrder?.start ? formatBookingDateTime(selectedCancelOrder.start, { booking_series_id: selectedCancelOrder.bookingSeriesId }).date : ""}
                            {selectedCancelOrder?.start ? " " : ""}
                            {selectedCancelOrder?.start
                                ? `${formatBookingDateTime(selectedCancelOrder.start, { booking_series_id: selectedCancelOrder.bookingSeriesId }).time} - ${formatBookingDateTime(selectedCancelOrder.end, { booking_series_id: selectedCancelOrder.bookingSeriesId }).time}`
                                : ""}
                        </p>
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
        </div>
    )
}

export default OrderPage;
