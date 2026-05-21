import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/src/lib/session';

export async function POST(request: NextRequest) {
  try {
    await destroySession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
