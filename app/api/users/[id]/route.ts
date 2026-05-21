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
    const { role, status, name } = body;

    try {
        const shouldIncrementVersion = role || status;
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(status && { status }),
                ...(name && { name }),
                ...(shouldIncrementVersion && { sessionVersion: { increment: 1 } }),
            },
        });
        return NextResponse.json(user);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
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

    try {
        await prisma.user.delete({
            where: { id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
