import CompanionForm from './components/CompanionForm';
import prismadb from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import React from 'react'

type Props = {
    params: Promise<{ companionId: string }>
}

const CompanionIdPage = async ({ params }: Props) => {
    const {userId, redirectToSignIn} = await auth();
    if(!userId) {
        return redirectToSignIn();
    }
    // TODO: Check Subscription
    const { companionId } = await params;
    const companion = await prismadb.companion.findUnique({
        where: {
            id: companionId,
            userId
        }
    });
    const categories = await prismadb.category.findMany({});
    return (
        <div>
            <CompanionForm initialData={companion} categories={categories} />
        </div>
    )
}

export default CompanionIdPage