const normalize = (value) => String(value ?? "").trim().toLowerCase();

export function findVenueSport(sports, selection) {
  const selected = normalize(selection);
  return sports.find((sport) => normalize(sport.id) === selected || normalize(sport.code) === selected);
}

export function resourceTypeForSport(sport) {
  return normalize(sport?.code);
}

export function resourcesForSport(resources, sport) {
  if (!Array.isArray(resources)) return [];
  const sportId = normalize(sport?.id);
  const resourceType = resourceTypeForSport(sport);
  return resources.filter((resource) =>
    (sportId && normalize(resource?.sport_id ?? resource?.sport?.id) === sportId)
    || (resourceType && normalize(resource?.resource_type) === resourceType));
}
