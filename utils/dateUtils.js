const getNextDueDate = (date, recurringType) => {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        throw new Error("Invalid date provided");
    }

    if (recurringType === "daily") {
        d.setDate(d.getDate() + 1);
    } else if (recurringType === "weekly") {
        d.setDate(d.getDate() + 7);
    } else if (recurringType === "monthly") {
        d.setMonth(d.getMonth() + 1);
    } else if (recurringType === "yearly") {
        d.setFullYear(d.getFullYear() + 1);
    } else {
        throw new Error("Invalid recurring frequency");
    }

    return d;
};

module.exports = { getNextDueDate };
