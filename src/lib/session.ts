import { IronSession, SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  sessionVersion?: number;
  lastValidated?: number;
  isLoggedIn?: boolean;
}

export interface SessionIron extends IronSession<SessionData> {}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
  cookieName: 'lms-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// const VALIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VALIDATION_INTERVAL_MS = 20 * 1000;

export async function getSession(): Promise<SessionIron> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session as SessionIron;
}

export async function createSession(data: SessionData): Promise<void> {
  const session = await getSession();
  session.userId = data.userId;
  session.email = data.email;
  session.name = data.name;
  session.role = data.role;
  session.status = data.status;
  session.sessionVersion = data.sessionVersion;
  session.lastValidated = Date.now();
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function validateSession(): Promise<{ valid: boolean; session: SessionIron }> {
  const session = await getSession();
  const now = Date.now();
  
  if (!session.isLoggedIn || !session.userId) {
    return { valid: false, session };
  }
  
  const shouldValidate = !session.lastValidated || (now - session.lastValidated) > VALIDATION_INTERVAL_MS;
  
  if (shouldValidate) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { status: true, role: true, sessionVersion: true }
    });
    
    if (!user) {
      await destroySession();
      return { valid: false, session };
    }
    
    if (session.sessionVersion !== user.sessionVersion) {
      await destroySession();
      return { valid: false, session };
    }
    
    session.status = user.status;
    session.role = user.role;
    session.sessionVersion = user.sessionVersion;
    session.lastValidated = now;
    await session.save();
  }
  
  return { valid: true, session };
}
