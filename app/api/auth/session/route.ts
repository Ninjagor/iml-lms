import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { valid, session } = await validateSession();

    if (!valid || !session.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
          status: session.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
