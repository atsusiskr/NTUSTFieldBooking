const timeValue = (value) => value ? new Date(value).getTime() : NaN;

export const isGroupExpired = (group, now = Date.now()) => {
    const end = timeValue(group?.end_time);
    return Number.isFinite(end) && now >= end;
};

export const isRegistrationClosed = (group, now = Date.now()) => {
    const deadline = timeValue(group?.registration_deadline);
    return Number.isFinite(deadline) && now >= deadline;
};
