import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const submissions = await prisma.submission.findMany({
    include: {
        user: { select: { id: true, name: true, email: true } }
    }
  });
  return NextResponse.json(submissions);
}

export async function PATCH(req: Request) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
  if (session.role !== "instructor" && session.role !== "teacher") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id, grade } = await req.json();
  if (!id) return new NextResponse("Missing ID", { status: 400 });

  const submission = await prisma.submission.update({
    where: { id },
    data: { grade: parseInt(grade) },
  });
  return NextResponse.json(submission);
}
