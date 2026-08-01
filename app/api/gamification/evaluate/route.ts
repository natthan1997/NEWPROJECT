import { NextResponse } from 'next/server';
import { evaluateOrderMissions } from '@/lib/gamification';

export async function POST(req: Request) {
  try {
    const { order_id, member_id } = await req.json();
    const result = await evaluateOrderMissions(order_id, member_id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, evaluated: result.evaluated });
  } catch (error: any) {
    console.error('Gamification Evaluation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
