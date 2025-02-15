import prismadb from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type RequestProps = {
    params: Promise<{ companionId: string }>
}

export const PATCH = async (req: Request, { params }: RequestProps) => {
    try {
        const { companionId } = await params;
        const body = await req.json();
        const user = await currentUser();
        const { src, name, description, instructions, seed, categoryId } = body;
        if (!companionId) {
            return new NextResponse("Companion ID is required", { status: 400 });
        }
        if (!user || !user.id || !user.firstName) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (!src || !name || !description || !instructions || !seed || !categoryId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }
        // TODO: Check for Subscription
        const companion = await prismadb.companion.update({
            where: {
                id: companionId
            },
            data: {
                src,
                name,
                description,
                instructions,
                seed,
                categoryId,
                userId: user.id,
                userName: user.firstName
            }
        });
        return NextResponse.json(companion, { status: 201 });
    }
    catch (error) {
        console.log('{COMPANION_PATCH}', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export const DELETE = async (req: Request, { params }: RequestProps) => {
    try {
        const { companionId } = await params;
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const companion = await prismadb.companion.delete({
            where: {
                userId,
                id: companionId
            }
        });
        return NextResponse.json(companion);
    }
    catch (error) {
        console.log('{COMPANION_DELETE}', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
