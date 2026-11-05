import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "../../../locale/i18n";
import { functionIconMap } from "../../../constant/IconMap";
import { pickUpService } from "../../../service/pickUpService";
import { describeRequestError } from "../../../utils/requestError";
import { successPopup } from "../../../components/pop-up";

export default function HostMessageDialog({ groupId, groupTitle, onClose }) {
    const t = useTranslation();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);
    const inFlight = useRef(false);

    const submit = async (event) => {
        event.preventDefault();
        if (inFlight.current) return;
        const message = { title: title.trim(), content: content.trim() };
        if (!message.title || !message.content) {
            setError(t("請填寫標題與訊息內容。"));
            return;
        }
        inFlight.current = true;
        setSending(true);
        setError("");
        try {
            await pickUpService.sendHostMessage(groupId, message);
            onClose();
            successPopup(t("訊息已送出"), t("團主會收到站內通知。"));
        } catch (failure) {
            const feedback = describeRequestError(failure, {
                400: { message: t("請檢查訊息內容；團主無法傳訊息給自己。") },
                429: { message: t("訊息傳送太頻繁，請稍後再試。") },
            });
            setError(feedback.message);
        } finally {
            inFlight.current = false;
            setSending(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 px-4 py-6" onMouseDown={(event) => { event.stopPropagation(); if (!inFlight.current) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="host-message-title" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><MessageCircle size={20} aria-hidden="true" /></span>
                        <h2 id="host-message-title" className="text-xl font-bold text-slate-900">{t("傳訊息給團主")}</h2>
                        <p className="mt-1 truncate text-sm text-slate-500">{groupTitle}</p>
                    </div>
                    <button type="button" aria-label={t("關閉")} disabled={sending} onClick={onClose}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                        {functionIconMap.cancel.icon}
                    </button>
                </div>
                <form onSubmit={submit} noValidate className="mt-5 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">{t("標題")}
                        <input value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} maxLength={100} disabled={sending}
                            placeholder={t("想詢問的主題")} className="mt-1.5 w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">{t("訊息內容")}
                        <textarea value={content} onChange={(event) => { setContent(event.target.value); setError(""); }} maxLength={2000} disabled={sending} rows={5}
                            placeholder={t("寫下你想詢問團主的事…")} className="mt-1.5 w-full min-w-0 resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <p className="text-right text-xs text-slate-500">{content.length}/2000</p>
                    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    <div className="flex gap-2 pt-1">
                        <button type="button" disabled={sending} onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t("取消")}</button>
                        <button type="submit" disabled={sending} className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{sending ? t("送出中…") : t("送出訊息")}</button>
                    </div>
                </form>
            </section>
        </div>, document.body
    );
}
