import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
}

export function ChatInput({ onSend, placeholder = 'Type your message...' }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message)
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4 bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <Button type="submit" disabled={!message.trim()}>
        Send
      </Button>
    </form>
  )
} 