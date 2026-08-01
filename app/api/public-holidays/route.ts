import { NextResponse } from 'next/server';
import Holidays from 'date-holidays';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const yearStr = searchParams.get('year');
        const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
        
        const hd = new Holidays('TH');
        const holidays = hd.getHolidays(year);
        
        // Format to match the old public_holidays table schema: { date: 'YYYY-MM-DD', name: '...' }
        const formattedHolidays = holidays.map(h => ({
            date: h.date.split(' ')[0],
            name: h.name
        }));

        return NextResponse.json(formattedHolidays);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
