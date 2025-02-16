"use client";

import { ChangeEvent, FormEvent } from "react";
import { ChatRequestOptions } from "ai";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";

type Props = {
    isLoading: boolean,
    input: string,
    handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void,
    onSubmit: (e: FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions | undefined) => void
}

const ChatForm = ({ handleInputChange, input, isLoading, onSubmit }: Props) => {
    return (
        <form onSubmit={onSubmit} className='border-t border-primary/10 py-4 flex items-center gap-x-2'>
            <Input disabled={isLoading} value={input} onChange={handleInputChange} placeholder="Type a message" className="rounded-lg bg-primary/10"/>
            <Button disabled={isLoading} variant="ghost">
                <SendHorizontal className="h-6 w-6"/>
            </Button>
        </form>
    )
}

export default ChatForm