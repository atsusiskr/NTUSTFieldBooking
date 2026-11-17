import { useEffect, useRef, useState } from "react";
import { CalendarDays, ExternalLink, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/navbar";
import { courseService } from "../../service/courseService";
import { useSportStore } from "../../store/sportStore";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { describeRequestError } from "../../utils/requestError";
import { errorPopup, successPopup } from "../../components/pop-up";
import { filterCourses, getMockCourseLevelRange } from "../utils/courseFilters";
import { getMockCourses, USE_MOCK_COACH_COURSES } from "../mock/mockCourses";
import { facilityMap, functionIconMap } from "../../constant/IconMap";
import { DoubleSlide } from "../../components/rangeSlide";
import { skillLevelService } from "../../service/skillLevelService";
import { CoachBioDialog, CoachProfileSection } from "../components/coach/CoachProfileSection";

const typeNames = { trial: "體驗課", single: "單堂課", recurring: "週期課" };
const money = (value) => `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;
const filterInputClass = "mt-2 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const MAX_PRICE = 20000;
const PRICE_LEVELS = Array.from({ length: MAX_PRICE / 500 + 1 }, (_, index) => {
  const level = index * 500;
  return { level, label: level === MAX_PRICE ? `NT$ ${level.toLocaleString("zh-TW")}+` : `NT$ ${level.toLocaleString("zh-TW")}` };
});
const when = (value) => value ? `${formatDateTime(value).fullDate} ${formatDateTime(value).time}` : "時間待公布";
const splitFacilities = (value) => typeof value === "string" ? value.split(/[,，;；\n_]+/).map((item) => item.trim()).filter(Boolean) : [];
const mapsUrl = (latitude, longitude) => {
  if (latitude == null || latitude === "" || longitude == null || longitude === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
};
const enrollmentLabel = (course, enrolledInMock = false) => {
  if (enrolledInMock || course?.my_enrollment_id) return "已報名";
  if (course?.remaining_seats != null && Number(course.remaining_seats) <= 0) return "已額滿";
  if (course?.status !== "open" || (course?.enrollment_deadline && new Date(course.enrollment_deadline).getTime() <= Date.now())) return "報名已截止";
  return "立即報名";
};
const courseLevelText = (course, levels) => {
  if (!course?.mock_level_label) return null;
  const range = getMockCourseLevelRange(course, levels);
  return `${range ? `${range[0]}–${range[1]} 級` : ""}`;
};

function CourseTimePlace({ course, detailed = false }) {
  const nextSession = course.sessions?.find((session) => session.status !== "cancelled" && session.start_at === course.next_session_at);
  const start = course.next_session_at ? formatDateTime(course.next_session_at) : null;
  const end = nextSession?.end_at ? formatDateTime(nextSession.end_at) : null;
  const location = course.location;
  const mapUrl = mapsUrl(location?.latitude, location?.longitude);
  return <div className={`grid gap-3 text-sm sm:grid-cols-2 ${detailed ? "mt-5" : "mt-4"}`}>
    <div className="flex min-h-20 items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-slate-700">
      <CalendarDays className="shrink-0 text-blue-600" size={22} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{detailed ? "下次上課時間" : "時間"}</p>
        <p className="mt-1 font-semibold text-slate-800">{start ? `${start.date}・${start.time}${end ? `–${end.time}` : ""}` : "時間待公布"}</p>
      </div>
    </div>
    <div className={`relative flex min-h-20 items-center gap-3 rounded-xl border px-3 py-3 text-slate-700 ${detailed && mapUrl ? "cursor-pointer border-slate-100 bg-slate-50 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500" : "border-transparent bg-slate-50"}`}>
      <MapPin className="shrink-0 text-blue-600" size={22} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">地點</p>
        <p className="mt-1 font-semibold text-slate-800">{location?.name || course.venue_name || "地點待公布"}</p>
        {detailed && location?.location_info && <p className="mt-1 text-xs leading-5 text-slate-600">{location.location_info}</p>}
        {detailed && mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 rounded-xl focus-visible:outline-none" aria-label="查看地圖" />}
        {detailed && mapUrl && <span className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600" aria-hidden="true">查看地圖 <ExternalLink size={14} /></span>}
      </div>
    </div>
  </div>;
}

function CourseDetail({ course, loading, error, mode, mockMode, levels, onClose, onRetry, onRequestEnroll, onViewCoach, onEnrolled }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFree = course?.is_free === true || (course?.total_fee != null && Number(course.total_fee) === 0);
  const registrationLabel = enrollmentLabel(course);
  const location = course?.location;
  const parkingMapUrl = mapsUrl(location?.parking_latitude, location?.parking_longitude);
  const facilities = splitFacilities(location?.facility);

  const submit = async () => {
    if (!course || submitting || registrationLabel !== "立即報名" || (!isFree && !paymentMethod)) return;
    setSubmitting(true);
    try {
      if (mockMode) {
        successPopup("示範報名成功", "這是示範資料，沒有送出任何 API 請求。");
      } else {
        await courseService.enroll(course.id, isFree ? undefined : paymentMethod);
        successPopup("報名成功", "已送出課程報名，請依選擇的方式付款。");
      }
      onEnrolled(course.id);
    } catch (requestError) {
      const failure = describeRequestError(requestError, {
        409: { title: "無法報名", message: "課程可能已額滿、截止或已報名，請重新整理後確認。" },
      });
      errorPopup(failure.title, failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={mode === "enroll" ? "確認課程報名" : "課程詳細資訊"} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><h2 className="text-2xl font-bold text-slate-900">{mode === "enroll" ? "確認課程報名" : course?.title || "課程詳細資訊"}</h2><button type="button" aria-label="關閉" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>
      {loading && <p role="status" className="py-8 text-slate-500">載入課程資訊中…</p>}
      {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}<button type="button" onClick={onRetry} className="ml-3 font-semibold underline">重試</button></div>}
      {course && !loading && <>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{typeNames[course.course_type] || "課程"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{course.sport_name}</span><span className="rounded-full bg-green-50 px-3 py-1 text-green-700">{isFree ? "免費" : money(course.total_fee)}</span></div>
        <p className="mt-4 font-semibold text-slate-900">{mode === "enroll" ? course.title : `開課者：${course.owner_name || "未提供"}`}</p>
        <CourseTimePlace course={course} detailed={mode === "detail"} />
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700"><p>剩餘名額：<strong className="text-slate-900">{course.remaining_seats ?? "—"} 人</strong></p><p>總堂數：<strong className="text-slate-900">{course.session_count ?? "—"} 堂</strong></p></div>
        {courseLevelText(course, levels) && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm"><span className="font-medium text-slate-600">適合程度</span><strong className="text-blue-700">{courseLevelText(course, levels)}</strong></div>}
        {mode === "detail" && <>
        <CoachProfileSection teachers={course.teachers} mockMode={mockMode} onViewCoach={onViewCoach} />
        <section className="mt-6"><h3 className="font-bold text-slate-900">場地設施</h3><div className="mt-3 flex flex-wrap gap-2">{facilities.length > 0 ? facilities.map((key) => <span key={key} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="text-lg text-blue-600 [&_svg]:h-5 [&_svg]:w-5">{facilityMap[key]?.icon}</span>{facilityMap[key]?.name || key}</span>) : <p className="text-sm text-slate-500">尚未提供場地設施資訊</p>}</div></section>
        <section className="mt-6"><h3 className="font-bold text-slate-900">停車資訊</h3><div className={`relative mt-3 flex items-center gap-3 rounded-xl border bg-white p-4 text-sm ${parkingMapUrl ? "cursor-pointer border-slate-200 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500" : "border-slate-200"}`}><span className="text-blue-600 [&_svg]:h-6 [&_svg]:w-6">{facilityMap.parking.icon}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{location?.parking_name || "尚未提供停車場資訊"}</p>{parkingMapUrl && <><a href={parkingMapUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 rounded-xl focus-visible:outline-none" aria-label="查看停車場地圖" /><span className="mt-1 inline-flex items-center gap-1 font-semibold text-blue-600" aria-hidden="true">查看停車場地圖 <ExternalLink size={14} /></span></>}</div></div></section>
        {course.description && <section className="mt-6"><h3 className="font-bold">課程介紹</h3><p className="mt-2 whitespace-pre-wrap text-slate-600">{course.description}</p></section>}
        {course.teaching_content && <section className="mt-5"><h3 className="font-bold">教學內容</h3><p className="mt-2 whitespace-pre-wrap text-slate-600">{course.teaching_content}</p></section>}
        {[["請假規則", course.rules_leave], ["補課規則", course.rules_makeup], ["取消規則", course.rules_cancellation], ["退款規則", course.rules_refund], ["缺席規則", course.rules_noshow]].some(([, value]) => value) && <section className="mt-5"><h3 className="font-bold">課程規則</h3>{[["請假規則", course.rules_leave], ["補課規則", course.rules_makeup], ["取消規則", course.rules_cancellation], ["退款規則", course.rules_refund], ["缺席規則", course.rules_noshow]].filter(([, value]) => value).map(([label, value]) => <p key={label} className="mt-2 whitespace-pre-wrap text-sm text-slate-600"><strong className="text-slate-800">{label}：</strong>{value}</p>)}</section>}
        {course.sessions?.length > 0 && <section className="mt-6"><h3 className="font-bold">上課時段</h3><div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200">{course.sessions.map((session) => <div key={session.id} className="border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">第 {session.seq} 堂・{when(session.start_at)}–{formatDateTime(session.end_at).time}{session.status === "cancelled" && <span className="ml-2 text-red-600">已取消</span>}</div>)}</div></section>}
        {course.enrollment_deadline && <p className="mt-5 text-sm text-slate-500">報名截止：{when(course.enrollment_deadline)}</p>}
        </>}
        {!isFree && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-semibold text-blue-950">費用：課程 {money(course.price)} + 場地 {money(course.venue_fee)} = {money(course.total_fee)}</p>{mode === "enroll" && <><label htmlFor="course-payment" className="mt-3 block text-sm font-medium">付款方式</label><select id="course-payment" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">請選擇付款方式</option>{course.payment_methods?.includes("onsite") && <option value="onsite">現場付款</option>}{course.payment_methods?.includes("transfer") && <option value="transfer">銀行轉帳</option>}</select></>}</div>}
        {registrationLabel === "已報名" && <p className="mt-5 rounded-xl bg-green-50 p-4 font-semibold text-green-700">你已報名這堂課程</p>}
        {mode === "detail" ? <button type="button" onClick={onRequestEnroll} disabled={registrationLabel !== "立即報名"} className="mt-6 min-h-11 w-full rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{registrationLabel}</button>
          : <button type="button" onClick={submit} disabled={registrationLabel !== "立即報名" || (!isFree && !paymentMethod) || submitting} className="mt-6 min-h-11 w-full rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{registrationLabel !== "立即報名" ? registrationLabel : submitting ? "送出中…" : "確認報名"}</button>}
      </>}
    </section>
  </div>;
}

export default function CoachGroupPage() {
  const sportId = useSportStore((state) => state.sportId);
  const mockMode = USE_MOCK_COACH_COURSES;
  const [mockEnrolledIds, setMockEnrolledIds] = useState(() => new Set());
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [coachDraft, setCoachDraft] = useState("");
  const [coachQuery, setCoachQuery] = useState("");
  const [levels, setLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsError, setLevelsError] = useState("");
  const [levelsRetry, setLevelsRetry] = useState(0);
  const [levelDraft, setLevelDraft] = useState(null);
  const [levelRange, setLevelRange] = useState(null);
  const [priceDraft, setPriceDraft] = useState([0, MAX_PRICE]);
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const allCoursesCache = useRef(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [detailMode, setDetailMode] = useState("detail");
  const [coachForBio, setCoachForBio] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!sportId) return;
    let active = true;
    setLevelsLoading(true);
    setLevelsError("");
    setLevels([]);
    setLevelDraft(null);
    setLevelRange(null);
    skillLevelService.getSkillLevels(sportId)
      .then((items) => {
        if (!active) return;
        const ordered = [...items].sort((a, b) => a.level - b.level);
        setLevels(ordered);
        const fullRange = ordered.length ? [ordered[0].level, ordered[ordered.length - 1].level] : null;
        setLevelDraft(fullRange);
        setLevelRange(fullRange);
      })
      .catch((requestError) => { if (active) setLevelsError(describeRequestError(requestError).message); })
      .finally(() => { if (active) setLevelsLoading(false); });
    return () => { active = false; };
  }, [sportId, levelsRetry]);

  useEffect(() => {
    if (!sportId) return;
    let active = true;
    setLoading(true);
    setError("");
    const params = { sport_id: sportId, keyword: keyword || undefined, sort_by: "next_session", sort_order: "asc" };
    const hasLevelFilter = Boolean(levels.length && levelRange
      && (levelRange[0] !== levels[0].level || levelRange[1] !== levels[levels.length - 1].level));
    const needsClientFilter = Boolean(coachQuery || hasLevelFilter
      || priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE);
    const clientFilters = { coach: coachQuery, levelRange: hasLevelFilter ? levelRange : null, levels,
      minPrice: priceRange[0] === 0 ? "" : priceRange[0],
      maxPrice: priceRange[1] === MAX_PRICE ? "" : priceRange[1] };
    let request;
    if (mockMode) {
      let items = getMockCourses(sportId);
      if (keyword) items = items.filter((course) => [course.title, course.owner_name]
        .some((value) => String(value || "").toLocaleLowerCase().includes(keyword.toLocaleLowerCase())));
      const filtered = filterCourses(items, clientFilters);
      request = Promise.resolve({ items: filtered.slice((page - 1) * 10, page * 10), total: filtered.length });
    } else if (needsClientFilter) {
      const cacheKey = JSON.stringify({ params, refresh });
      if (allCoursesCache.current?.key !== cacheKey) {
        allCoursesCache.current = { key: cacheKey, promise: courseService.getAll(params) };
      }
      request = allCoursesCache.current.promise.then((items) => {
        const filtered = filterCourses(items, clientFilters);
        return { items: filtered.slice((page - 1) * 10, page * 10), total: filtered.length };
      });
    } else {
      request = courseService.getList({ ...params, page, page_size: 10 });
    }
    request.then(async (data) => {
      const items = data.items;
      if (active) { setCourses(items); setTotal(Number(data.total) || 0); }
    })
      .catch((requestError) => { if (active) { setCourses([]); setError(describeRequestError(requestError).message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sportId, keyword, coachQuery, levelRange, levels, priceRange, page, refresh, mockMode]);

  useEffect(() => {
    if (!detailId) return;
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    const request = mockMode
      ? Promise.resolve(getMockCourses(sportId).find((course) => course.id === detailId))
      : courseService.getDetail(detailId).then((course) => courseService.withLocation(course));
    request
      .then((data) => { if (active) setDetail(mockMode && mockEnrolledIds.has(detailId)
        ? { ...data, my_enrollment_id: `demo-enrollment-${detailId}` } : data); })
      .catch((requestError) => { if (active) setDetailError(describeRequestError(requestError).message); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [detailId, detailRetry, mockMode, sportId, mockEnrolledIds]);

  const openCourse = (id, mode) => { setDetail(null); setDetailMode(mode); setDetailId(id); };
  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setKeyword(draft.trim());
    setCoachQuery(coachDraft.trim());
    setLevelRange(levelDraft);
    setPriceRange(priceDraft);
    setIsFilterOpen(false);
  };
  const clearFilters = () => {
    setDraft(""); setKeyword(""); setCoachDraft(""); setCoachQuery("");
    const fullRange = levels.length ? [levels[0].level, levels[levels.length - 1].level] : null;
    setLevelDraft(fullRange); setLevelRange(fullRange);
    setPriceDraft([0, MAX_PRICE]); setPriceRange([0, MAX_PRICE]);
    setPage(1);
  };
  const pageCount = Math.max(1, Math.ceil(total / 10));
  const visibleTeachers = [...new Map(courses.flatMap((course) => Array.isArray(course.teachers) ? course.teachers : [])
    .map((teacher) => [teacher.user_id || teacher.display_name, teacher])).values()];
  const activeFilterCount = Number(Boolean(keyword)) + Number(Boolean(coachQuery))
    + Number(Boolean(levels.length && levelRange && (levelRange[0] !== levels[0].level || levelRange[1] !== levels[levels.length - 1].level)))
    + Number(priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE);
  return <div className="app-page min-h-screen text-slate-900"><Navbar /><main className="mx-auto w-[95%] max-w-7xl pb-24">
    <header className="relative my-8 min-h-11">
      <h1 className="px-12 text-center text-3xl font-bold">教練團</h1>
      <button type="button" aria-label="篩選課程" aria-expanded={isFilterOpen} aria-controls="coach-course-filters" onClick={() => setIsFilterOpen((open) => !open)} className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-blue-200 bg-white text-blue-700 shadow-sm hover:bg-blue-50 md:hidden">
        <SlidersHorizontal size={22} aria-hidden="true" />
        {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">{activeFilterCount}</span>}
      </button>
    </header>
    <section id="coach-course-filters" className={`grid transition-[grid-template-rows,opacity,transform,margin,visibility] duration-500 ease-out motion-reduce:transition-none ${isFilterOpen ? "visible mb-6 grid-rows-[1fr] translate-y-0 opacity-100" : "invisible mb-0 grid-rows-[0fr] -translate-y-2 opacity-0 pointer-events-none"} md:visible md:mb-6 md:grid-rows-[1fr] md:translate-y-0 md:opacity-100 md:pointer-events-auto`}>
      <div className="min-h-0 overflow-hidden">
        <form onSubmit={applyFilters} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-gray-900">篩選課程</h2><button type="button" aria-label="關閉篩選" onClick={() => setIsFilterOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100 md:hidden"><X size={20} aria-hidden="true" /></button></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-bold tracking-wider text-gray-500">課程或開課者<input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="搜尋名稱" className={filterInputClass} /></label>
            <label className="block text-xs font-bold tracking-wider text-gray-500">教練名稱<input type="search" value={coachDraft} onChange={(event) => setCoachDraft(event.target.value)} placeholder="搜尋授課教練" className={filterInputClass} /></label>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><p className="mb-3 text-xs font-bold tracking-wider text-gray-500">篩選程度</p>{levelsLoading ? <p role="status" className="text-sm text-slate-500">載入目前球類的程度級距中…</p> : levelsError ? <p role="alert" className="text-sm text-red-600">程度載入失敗：{levelsError} <button type="button" onClick={() => setLevelsRetry((value) => value + 1)} className="font-semibold text-blue-600 underline">重試</button></p> : levels.length ? <DoubleSlide value={levelDraft} onChange={setLevelDraft} levels={levels} /> : <p className="text-sm text-slate-500">未標示程度的課程不會列入縮小範圍後的結果。</p>}</div>
            <div><p className="mb-3 text-xs font-bold tracking-wider text-gray-500">金額範圍</p><DoubleSlide value={priceDraft} onChange={setPriceDraft} levels={PRICE_LEVELS} /><p className="mt-2 text-xs text-slate-500">上限 20,000+ 表示不限制最高金額。</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Search size={18} aria-hidden="true" />套用篩選</button><button type="button" onClick={clearFilters} className="min-h-10 rounded-lg border border-red-100 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50">清除</button></div>
        </form>
      </div>
    </section>
    {!sportId && <p role="status" className="rounded-xl bg-white p-6">載入球類資料中…</p>}{loading && sportId && <p role="status" className="rounded-xl bg-white p-6">載入課程中…</p>}{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">課程載入失敗：{error}<button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-3 font-semibold underline">重試</button></div>}{!loading && !error && courses.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-slate-500">目前沒有符合條件的課程。</p>}
    {!loading && !error && visibleTeachers.length > 0}
    <div className="grid gap-4 md:grid-cols-2">{!loading && !error && courses.map((course) => {
      const registrationLabel = enrollmentLabel(course, mockMode && mockEnrolledIds.has(course.id));
      return <article key={course.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{course.title}</h2><span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-sm text-blue-700">{typeNames[course.course_type] || "課程"}</span></div><p className="mt-2 text-sm text-slate-500">開課者：{course.owner_name || "未提供"}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">剩餘 {course.remaining_seats ?? "—"} 人</span></div>
        <CourseTimePlace course={course} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-3 py-1 text-sm">{course.session_count ?? 0} 堂</span>{courseLevelText(course, levels) && <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">程度：{courseLevelText(course, levels)}</span>}<span className="rounded-md border border-green-200 bg-green-50 px-3 py-1 font-semibold text-green-700">{course.is_free ? "免費" : money(course.total_fee)}</span></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={() => openCourse(course.id, "detail")} className="min-h-11 w-2/5 rounded-lg border border-blue-300 px-4 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 sm:w-auto">顯示詳細</button>
            <button type="button" onClick={() => openCourse(course.id, "enroll")} disabled={registrationLabel !== "立即報名"} className="min-h-11 flex-1 rounded-lg bg-blue-500 px-6 py-2 font-bold tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">{registrationLabel}</button>
          </div>
        </div>
      </article>;
    })}</div>
    {!loading && !error && total > 10 && <nav aria-label="課程分頁" className="mt-6 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="text-sm text-slate-600">第 {page} / {pageCount} 頁・共 {total} 筆</span><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">上一頁</button><button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">下一頁</button></nav>}
  </main>
    <button type="button" onClick={() => setRefresh((value) => value + 1)} className="fixed bottom-4 right-4 z-50 flex items-center justify-center gap-2 rounded-full bg-gray-700 px-5 py-3 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
      {functionIconMap.refresh.icon}<span className="font-bold tracking-wider">重新整理</span>
    </button>
    {detailId && <CourseDetail key={`${detailId}-${detailMode}`} course={detail} loading={detailLoading} error={detailError} mode={detailMode} mockMode={mockMode} levels={levels} onClose={() => setDetailId(null)} onRetry={() => setDetailRetry((value) => value + 1)} onRequestEnroll={() => setDetailMode("enroll")} onViewCoach={setCoachForBio} onEnrolled={(id) => { if (mockMode) setMockEnrolledIds((previous) => new Set(previous).add(id)); setDetailId(null); setRefresh((value) => value + 1); }} />}
    <CoachBioDialog coach={coachForBio} onClose={() => setCoachForBio(null)} />
  </div>;
}
