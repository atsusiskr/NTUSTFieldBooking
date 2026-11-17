const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
const levelKeywords = [
  /初級|入門|零基礎|基礎|新手/,
  /中級|中階/,
  /進階|高級|高階/,
];

export function getMockCourseLevelRange(course, levels) {
  const band = ["初級", "中級", "進階"].indexOf(course?.mock_level_label);
  if (band < 0 || !levels?.length) return null;
  const ordered = [...levels].sort((a, b) => a.level - b.level);
  const start = Math.floor(band * ordered.length / 3);
  const end = Math.max(start, Math.ceil((band + 1) * ordered.length / 3) - 1);
  return [ordered[start].level, ordered[end].level];
}

function matchesLevelRange(course, levelRange, levels) {
  if (!levelRange || !levels?.length) return true;
  const mockRange = getMockCourseLevelRange(course, levels);
  if (mockRange) {
    return mockRange[0] <= levelRange[1] && mockRange[1] >= levelRange[0];
  }
  const description = `${course.description || ""} ${course.teaching_content || ""}`;
  const ordered = [...levels].sort((a, b) => a.level - b.level);
  const matched = new Set();
  levelKeywords.forEach((pattern, category) => {
    if (!pattern.test(description)) return;
    const start = Math.floor(category * ordered.length / levelKeywords.length);
    const end = Math.ceil((category + 1) * ordered.length / levelKeywords.length);
    ordered.slice(start, end).forEach(({ level }) => matched.add(level));
  });
  for (const result of description.matchAll(/(?:程度|等級|level)\s*[:：]?\s*(\d+)(?:\s*[-~～至到]\s*(\d+))?/gi)) {
    const start = Number(result[1]);
    const end = Number(result[2] || result[1]);
    ordered.filter(({ level }) => level >= Math.min(start, end) && level <= Math.max(start, end))
      .forEach(({ level }) => matched.add(level));
  }
  if (!matched.size) ordered.forEach(({ level, label }) => {
    const name = normalize(label);
    if (name.length >= 2 && !/^\d+$/.test(name) && normalize(description).includes(name)) matched.add(level);
  });
  return [...matched].some((level) => level >= levelRange[0] && level <= levelRange[1]);
}

export function filterCourses(courses, { coach = "", level = "", levelRange = null, levels = [], minPrice = "", maxPrice = "" } = {}) {
  const coachName = normalize(coach);
  const levelKeyword = normalize(level);
  const min = minPrice === "" ? null : Number(minPrice);
  const max = maxPrice === "" ? null : Number(maxPrice);
  return courses.filter((course) => {
    const teachers = Array.isArray(course.teachers) ? course.teachers : [];
    const names = teachers.map((teacher) => teacher.display_name);
    if (course.owner_type === "coach") names.push(course.owner_name);
    if (coachName && !names.some((name) => normalize(name).includes(coachName))) return false;
    if (levelKeyword && ![course.description, course.teaching_content]
      .some((value) => normalize(value).includes(levelKeyword))) return false;
    if (!matchesLevelRange(course, levelRange, levels)) return false;
    const amount = Number(course.total_fee);
    if ((min !== null || max !== null) && (!Number.isFinite(amount)
      || (min !== null && amount < min) || (max !== null && amount > max))) return false;
    return true;
  });
}
