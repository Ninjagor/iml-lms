import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { quizId, grades } = body; // grades is array of { userId, score, maxScore }

  if (!quizId || !Array.isArray(grades)) return new NextResponse("Missing fields", { status: 400 });

  const operations = grades.map((g: any) => 
    prisma.quizGrade.upsert({
      where: {
        quizId_userId: {
          quizId,
          userId: g.userId,
        }
      },
      update: {
        score: parseInt(g.score),
        maxScore: parseInt(g.maxScore),
      },
      create: {
        quizId,
        userId: g.userId,
        score: parseInt(g.score),
        maxScore: parseInt(g.maxScore),
      }
    })
  );

  await prisma.$transaction(operations);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("quizId");
  const userId = searchParams.get("userId");

  if (!quizId || !userId) return new NextResponse("Missing fields", { status: 400 });

  await prisma.quizGrade.delete({
    where: {
      quizId_userId: {
        quizId,
        userId,
      }
    }
  });

  return NextResponse.json({ success: true });
}
