import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [lectures, total] = await Promise.all([
    prisma.lecture.findMany({
      orderBy: { date: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.lecture.count(),
  ]);

  return NextResponse.json({
    lectures,
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

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, date, topic, materials } = body;

  if (!title || !date || !topic) return new NextResponse("Missing fields", { status: 400 });

  const lecture = await prisma.lecture.create({
    data: {
      title,
      date: new Date(date),
      topic,
      materials: materials || [],
    },
  });
  return NextResponse.json(lecture);
}

export async function DELETE(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing ID", { status: 400 });

  await prisma.lecture.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
