import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.announcement.count(),
  ]);

  return NextResponse.json({
    announcements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isStaff = session.role === "instructor" || session.role === "teacher";

  if (!isStaff) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, body: content } = body;

  if (!title || !content) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: content,
        userId: session.userId,
      },
    });
    return NextResponse.json(announcement);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
