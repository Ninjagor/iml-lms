import { validateSession } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { valid, session } = await validateSession();

  if (!valid || !session.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isStaff = session.role === "instructor" || session.role === "teacher";

  if (!isStaff) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.announcement.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
