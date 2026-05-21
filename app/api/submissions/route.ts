import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

  const submissions = await prisma.submission.findMany({
    where: { userId: session.userId },
  });

  return NextResponse.json(submissions);
}

export async function POST(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { homeworkId, materials } = await req.json();
  if (!homeworkId || !materials || !Array.isArray(materials)) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const existing = await prisma.submission.findFirst({
    where: { homeworkId, userId: session.userId },
  });

  if (existing) {
    const updated = await prisma.submission.update({
      where: { id: existing.id },
      data: { materials, submittedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.submission.create({
    data: {
      homeworkId,
      userId: session.userId,
      materials,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(created);
}

export async function DELETE(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing ID", { status: 400 });

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission || submission.userId !== session.userId) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  await prisma.submission.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
