import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  const isStaff = session.role === "instructor" || session.role === "teacher";

  const students = isStaff
    ? await prisma.user.findMany({ where: { role: "student" }, orderBy: { name: "asc" } })
    : await prisma.user.findMany({ where: { id: session.userId } });

  const homeworks = await prisma.homework.findMany({ orderBy: { dueDate: "asc" } });
  const quizzes = await prisma.quiz.findMany({ orderBy: { date: "asc" } });

  const quizGrades = await prisma.quizGrade.findMany({
    where: isStaff ? {} : { userId: session.userId }
  });

  const submissions = await prisma.submission.findMany({
    where: isStaff ? {} : { userId: session.userId }
  });

  return NextResponse.json({
    students,
    homeworks,
    quizzes,
    quizGrades,
    submissions
  });
}
