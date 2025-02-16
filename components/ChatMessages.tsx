"use client";
import { Companion } from '@prisma/client'
import ChatMessage, { ChatMessageProps } from '@/components/ChatMessage';
import { ComponentRef, useEffect, useRef, useState } from 'react';

type Props = {
  companion: Companion
  isLoading: boolean
  messages: ChatMessageProps[]
}

const ChatMessages = ({ messages = [], companion, isLoading= true }: Props) => {
  const scrollRef = useRef<ComponentRef<"div">>(null);
  const [fakeLoading, setFakeLoading] = useState(messages.length === 0 ? true : false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFakeLoading(false);
    }, 1000);
    return ()=>{
      clearTimeout(timeout);
    }
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);
  return (
    <div className='flex-1 overflow-y-auto pr-4'>
      <ChatMessage isLoading={fakeLoading} src={companion.src} role='system' content={`Hello, I am ${companion.name}, ${companion.description} `} />
      {messages.map((message)=>(
        <ChatMessage key={message.content} role={message.role} content={message.content} src={message.src} />
      ))}
      {isLoading && <ChatMessage isLoading={true} role='system' src={companion.src} />}
      <div ref={scrollRef}/>
    </div>
  )
}

export default ChatMessages