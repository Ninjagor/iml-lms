import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const { valid, session } = await validateSession();

    if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

    let quizzes;
    if (session.role === "instructor" || session.role === "teacher") {
        quizzes = await prisma.quiz.findMany({
            orderBy: { date: "asc" },
            include: {
                grades: true,
            }
        });
    } else {
        quizzes = await prisma.quiz.findMany({
            orderBy: { date: "asc" },
            include: {
                grades: {
                    where: { userId: session.userId }
                }
            }
        });
    }
    return NextResponse.json(quizzes);
}

export async function POST(req: Request) {
    const { valid, session } = await validateSession();

    if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
    if (session.role !== "instructor" && session.role !== "teacher") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, type, date, points, instructions, isPublished, answerKeyTitle, answerKeyUrl } = body;

    if (!title || !date) return new NextResponse("Missing fields", { status: 400 });

    const quiz = await prisma.quiz.create({
        data: {
            title,
            type,
            date: new Date(date),
            points: parseInt(points) || 10,
            instructions,
            isPublished: !!isPublished,
            answerKeyTitle,
            answerKeyUrl,
        },
    });
    return NextResponse.json(quiz);
}
