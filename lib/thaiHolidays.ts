export function getThaiHoliday(date: Date): string | null {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const monthDay = `${month}-${day}`;
    const fullDate = `${year}-${month}-${day}`;

    // Fixed Date Holidays
    const fixedHolidays: Record<string, string> = {
        '01-01': 'วันขึ้นปีใหม่',
        '04-06': 'วันจักรี',
        '04-13': 'วันสงกรานต์',
        '04-14': 'วันสงกรานต์',
        '04-15': 'วันสงกรานต์',
        '05-01': 'วันแรงงานแห่งชาติ',
        '05-04': 'วันฉัตรมงคล',
        '06-03': 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี',
        '07-28': 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว',
        '08-12': 'วันแม่แห่งชาติ',
        '10-13': 'วันคล้ายวันสวรรคต ร.9',
        '10-23': 'วันปิยมหาราช',
        '12-05': 'วันพ่อแห่งชาติ',
        '12-10': 'วันรัฐธรรมนูญ',
        '12-31': 'วันสิ้นปี'
    };

    if (fixedHolidays[monthDay]) {
        return fixedHolidays[monthDay];
    }

    // Dynamic Holidays (Lunar based) for 2026 (Current Year) and nearby years
    const dynamicHolidays: Record<string, string> = {
        // 2026 Lunar Holidays (Approximations/Actuals for 2026)
        '2026-03-03': 'วันมาฆบูชา',
        '2026-05-31': 'วันวิสาขบูชา',
        '2026-07-29': 'วันอาสาฬหบูชา',
        '2026-07-30': 'วันเข้าพรรษา',
        
        // 2025 Lunar Holidays
        '2025-02-13': 'วันมาฆบูชา',
        '2025-05-11': 'วันวิสาขบูชา',
        '2025-07-10': 'วันอาสาฬหบูชา',
        '2025-07-11': 'วันเข้าพรรษา'
    };

    if (dynamicHolidays[fullDate]) {
        return dynamicHolidays[fullDate];
    }

    return null;
}
