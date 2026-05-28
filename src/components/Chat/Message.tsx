import type { ChatTurn } from '../../types/chat';

interface Props {
  turn: ChatTurn;
}

export function Message({ turn }: Props) {
  const isUser = turn.role === 'user';

  return (
    <div className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <img
        className="w-10 h-10 rounded-full"
        src={isUser
          ? 'https://placehold.co/100x100/E2E8F0/4A5568?text=U'
          : 'https://placehold.co/100x100/FFFFFF/3B82F6?text=AI'}
        alt={isUser ? 'User' : 'Bot'}
      />
      <div className={`p-3 rounded-lg max-w-xs ${isUser ? 'bg-gray-200' : 'bg-blue-100'}`}>
        <p className="text-sm text-gray-800">{turn.parts[0].text}</p>
      </div>
    </div>
  );
}
