import CompanionForm from './components/CompanionForm';
import prismadb from '@/lib/db';
import React from 'react'

type Props = {
    params: Promise<{ companionId: string }>
}


const CompanionIdPage = async ({params }: Props) => {
    // TODO: Check Subscription
    const {companionId} = await params;
    const companion = await prismadb.companion.findUnique({
        where: {
            id: companionId
        }
    });
    const categories = await prismadb.category.findMany({});
    return (
        <div>
            <CompanionForm initialData={companion} categories={categories}/>
        </div>
    )
}

export default CompanionIdPage