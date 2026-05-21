import { getSession, validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
    if (session.role !== "instructor" && session.role !== "teacher") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
}

export async function POST(req: Request) {
    const { valid, session } = await validateSession();

    if (!valid || !session.userId) return new NextResponse("Unauthorized", { status: 401 });
    if (session.role !== "instructor" && session.role !== "teacher") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, email, role, id } = body;

    if (!name || !email || !role || !id) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    try {
        const user = await prisma.user.create({
            data: {
                id,
                name,
                email,
                role,
                status: "active",
            },
        });
        return NextResponse.json(user);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
