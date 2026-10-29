export function getPickUpPartyDetails(order) {
    const groupOrder = order?.pickupGroup?.orders?.find((item) => String(item.id) === String(order.id));
    const rawSize = order?.party_size ?? groupOrder?.party_size;
    const members = Array.isArray(order?.members) ? order.members
        : Array.isArray(groupOrder?.members) ? groupOrder.members : [];
    const parsedSize = Number(rawSize);
    const partySize = Number.isInteger(parsedSize) && parsedSize > 1 ? parsedSize : members.length;
    if (partySize <= 1) return null;

    return {
        partySize,
        organizerName: order?.organizer_name || groupOrder?.organizer_name
            || order?.booker_name || groupOrder?.booker_name || "",
        members,
    };
}
