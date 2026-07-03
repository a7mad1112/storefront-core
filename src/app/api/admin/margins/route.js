import { NextResponse } from 'next/server';
import { upsertMargin } from '../../../../lib/queries';

export async function POST(req) {
  try {
    const body = await req.json();
    const { categoryId, marginType, marginValue } = body;

    if (!categoryId || !marginType || marginValue == null) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    await upsertMargin(categoryId, marginType, Number(marginValue));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/admin/margins]', err);
    return NextResponse.json({ error: err.message || 'فشل حفظ الهامش' }, { status: 500 });
  }
}
