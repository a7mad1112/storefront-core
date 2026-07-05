import { NextResponse } from 'next/server';
import { upsertAvailabilityOverride, deleteAvailabilityOverride } from '../../../../lib/queries';

export async function POST(req) {
  try {
    const body = await req.json();
    const { productSupplierId, isAvailable, action, reason = null, overriddenBy = 'admin' } = body;

    if (!productSupplierId) {
      return NextResponse.json({ error: 'معرّف المنتج مطلوب' }, { status: 400 });
    }

    if (action === 'revert') {
      await deleteAvailabilityOverride(productSupplierId);
      return NextResponse.json({ success: true, action: 'reverted' });
    } else {
      if (isAvailable == null) {
        return NextResponse.json({ error: 'حالة التوفر مطلوبة' }, { status: 400 });
      }
      await upsertAvailabilityOverride(productSupplierId, Boolean(isAvailable), reason, overriddenBy);
      return NextResponse.json({ success: true, action: 'overridden' });
    }
  } catch (err) {
    console.error('[POST /api/admin/availability]', err);
    return NextResponse.json({ error: err.message || 'فشل حفظ حالة التوفر' }, { status: 500 });
  }
}
