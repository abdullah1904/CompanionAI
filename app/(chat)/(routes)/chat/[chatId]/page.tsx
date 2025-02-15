import prismadb from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ChatClient from './components/ChatClient';

type Props = {
    params: Promise<{ chatId: string }>
}

const ChatPage = async ({ params }: Props) => {
    const { chatId } = await params;
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
        return redirectToSignIn();
    }
    const companion = await prismadb.companion.findUnique({
        where: {
            id: chatId
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: 'asc'
                },
                where: {
                    userId: userId
                }
            },
            _count: {
                select: {
                    messages: true
                }
            }
        }
    });
    if(!companion) {
        return redirect("/");
    }
    return (
        <ChatClient companion={companion}/>
    )
}

export default ChatPage