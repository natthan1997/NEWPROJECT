const Holidays = require('date-holidays');
const hd = new Holidays('TH');
const dateObj = new Date('2026-07-28T09:00:00+07:00'); // 9 AM in Thailand
console.log(dateObj.toString());
const holidaysForDay = hd.isHoliday(dateObj);
console.log(holidaysForDay);
