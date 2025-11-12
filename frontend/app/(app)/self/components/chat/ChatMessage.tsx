import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface ChatMessageProps {
  message: string
  isUser?: boolean
  avatar?: string
  name?: string
  role?: string
  onFeedback?: (type: 'like' | 'dislike') => void
}

export function ChatMessage({
  message,
  isUser = false,
  avatar = '',
  name = '',
  role = '',
  onFeedback,
}: ChatMessageProps) {
  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'bg-gray-50' : 'bg-white'}`}>
      <Avatar
        imageUrl={avatar}
        className="flex-shrink-0"
      />
      <div className="flex-1">
        {!isUser && (
          <div className="mb-2">
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{role}</div>
          </div>
        )}
        <div className="text-gray-900">{message}</div>
        {!isUser && onFeedback && (
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback('like')}
              className="text-gray-500 hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback('dislike')}
              className="text-gray-500 hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 