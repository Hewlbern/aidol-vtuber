import { useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface Message {
  id: string
  text: string
  isUser: boolean
  avatar?: string
  name?: string
  role?: string
}

interface ChatProps {
  initialMessages?: Message[]
  onSendMessage: (message: string) => void
  onMessageFeedback?: (messageId: string, type: 'like' | 'dislike') => void
}

export function Chat({ initialMessages = [], onSendMessage, onMessageFeedback }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  const handleSend = (message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
    }
    setMessages((prev) => [...prev, newMessage])
    onSendMessage(message)
  }

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    onMessageFeedback?.(messageId, type)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              avatar={message.avatar}
              name={message.name}
              role={message.role}
              onFeedback={
                !message.isUser && onMessageFeedback
                  ? (type) => handleFeedback(message.id, type)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  )
} 