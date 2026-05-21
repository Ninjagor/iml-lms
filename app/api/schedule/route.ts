import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [schedule, total] = await Promise.all([
    prisma.schedule.findMany({
      orderBy: { date: "asc" },
      take: limit,
      skip: skip,
    }),
    prisma.schedule.count(),
  ]);

  return NextResponse.json({
    schedule,
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
  const { date, day, topic, type, materials } = body;

  if (!date || !topic || !type) return new NextResponse("Missing fields", { status: 400 });

  const scheduleItem = await prisma.schedule.create({
    data: {
      date: new Date(date),
      day,
      topic,
      type,
      materials: materials || [], // Expecting [{title, url}, ...]
    },
  });
  return NextResponse.json(scheduleItem);
}

export async function PATCH(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { id, date, day, topic, type, materials } = body;

  if (!id) return new NextResponse("Missing ID", { status: 400 });

  const updatedItem = await prisma.schedule.update({
    where: { id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(day && { day }),
      ...(topic && { topic }),
      ...(type && { type }),
      ...(materials && { materials }),
    },
  });
  return NextResponse.json(updatedItem);
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

  await prisma.schedule.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
