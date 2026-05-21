import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, type, date, points, instructions, isPublished, answerKeyTitle, answerKeyUrl } = body;

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(type && { type }),
      ...(date && { date: new Date(date) }),
      ...(points !== undefined && { points: parseInt(points) }),
      ...(instructions !== undefined && { instructions }),
      ...(isPublished !== undefined && { isPublished }),
      ...(answerKeyTitle !== undefined && { answerKeyTitle }),
      ...(answerKeyUrl !== undefined && { answerKeyUrl }),
    },
  });
  return NextResponse.json(quiz);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  await prisma.quiz.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
