export const getLastYearDate = () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    return lastYear.toISOString();
}

export const getCurrentDate = () => {
    const currentDate = new Date();
    return currentDate.toISOString();
}
