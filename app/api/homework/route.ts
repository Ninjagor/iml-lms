import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const homework = await prisma.homework.findMany({
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(homework);
}

export async function POST(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { name, dueDate, points, description, materials } = body;

  if (!name || !dueDate) return new NextResponse("Missing fields", { status: 400 });

  const hw = await prisma.homework.create({
    data: {
      name,
      dueDate: new Date(dueDate),
      points: parseInt(points) || 100,
      description,
      materials: materials || [],
    },
  });
  return NextResponse.json(hw);
}

export async function PATCH(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { id, name, dueDate, points, description, materials } = body;

  if (!id) return new NextResponse("Missing ID", { status: 400 });

  const hw = await prisma.homework.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(points && { points: parseInt(points) }),
      ...(description && { description }),
      ...(materials && { materials }),
    },
  });
  return NextResponse.json(hw);
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

  await prisma.homework.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
