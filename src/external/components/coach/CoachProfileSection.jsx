import { Award, BookOpen, Mail, UserRound, X } from "lucide-react";
import { getMockCoachProfile } from "../../mock/mockCourses";

const contactHref = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")
  ? `mailto:${email}` : null;

function CoachAvatar({ coach, size = "h-12 w-12" }) {
  const name = coach.display_name || "教練";
  return <span className={`relative grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700`}>
    {coach.avatar_thumbnail || coach.avatar
      ? <img src={coach.avatar_thumbnail || coach.avatar} alt={`${name}的頭像`} className="h-full w-full object-cover" />
      : name.charAt(0)}
  </span>;
}

export function CoachProfileSection({ teachers = [], mockMode, onViewCoach, directory = false }) {
  const coaches = teachers.map((teacher) => ({
    ...teacher,
    ...(mockMode ? getMockCoachProfile(teacher.user_id) : null),
  }));

  return <section className={directory ? "mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" : "mt-6"} aria-label={directory ? "教練介紹" : "授課教練"}>
    <h3 className="font-bold text-slate-900">{directory ? "教練介紹" : "授課教練"}</h3>
    {coaches.length === 0 ? <p className="mt-3 text-sm text-slate-500">尚未提供授課教練資訊</p> : <div className={directory ? "mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "mt-3 grid gap-3"}>
      {coaches.map((coach) => {
        const email = contactHref(coach.email);
        return <div key={coach.user_id || coach.display_name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CoachAvatar coach={coach} />
            <div className="min-w-0 flex-1">
              <button type="button" onClick={() => onViewCoach(coach)} className="text-left font-bold text-slate-900 hover:text-blue-700 hover:underline">{coach.display_name || "教練"}</button>
              {coach.specialties?.length > 0 && <p className="mt-1 truncate text-sm text-slate-500">專長：{coach.specialties.join("、")}</p>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onViewCoach(coach)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-200 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"><BookOpen size={16} aria-hidden="true" />查看簡歷</button>
            {email ? <a href={email} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"><Mail size={16} aria-hidden="true" />聯絡教練</a>
              : <button type="button" disabled className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-400"><Mail size={16} aria-hidden="true" />暫無聯絡方式</button>}
          </div>
        </div>;
      })}
    </div>}
  </section>;
}

export function CoachBioDialog({ coach, onClose }) {
  if (!coach) return null;
  const email = contactHref(coach.email);
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={`${coach.display_name || "教練"}簡歷`} className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><CoachAvatar coach={coach} size="h-14 w-14" /><div><p className="text-xs font-semibold text-blue-600">授課教練</p><h2 className="text-xl font-bold text-slate-900">{coach.display_name || "教練"}</h2></div></div>
        <button type="button" aria-label="關閉簡歷" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X size={21} aria-hidden="true" /></button>
      </div>
      <div className="mt-6 space-y-5">
        <section><h3 className="flex items-center gap-2 font-bold text-slate-900"><UserRound size={18} className="text-blue-600" aria-hidden="true" />教練簡介</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{coach.bio || "目前尚未提供教練簡歷。"}</p></section>
        {coach.experience_years != null && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">教學經驗 <strong>{coach.experience_years} 年</strong></p>}
        {coach.specialties?.length > 0 && <section><h3 className="font-bold text-slate-900">教學專長</h3><div className="mt-2 flex flex-wrap gap-2">{coach.specialties.map((specialty) => <span key={specialty} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{specialty}</span>)}</div></section>}
        {coach.certifications?.length > 0 && <section><h3 className="flex items-center gap-2 font-bold text-slate-900"><Award size={18} className="text-blue-600" aria-hidden="true" />相關研習</h3><ul className="mt-2 space-y-1 text-sm text-slate-600">{coach.certifications.map((certification) => <li key={certification}>{certification}</li>)}</ul></section>}
      </div>
      {email ? <a href={email} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700"><Mail size={18} aria-hidden="true" />聯絡教練</a>
        : <p className="mt-6 text-center text-sm text-slate-500">目前尚未提供聯絡方式</p>}
    </section>
  </div>;
}
