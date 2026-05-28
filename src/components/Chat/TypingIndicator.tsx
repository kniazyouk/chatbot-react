export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4">
      <img
        className="w-8 h-8 rounded-full"
        src="https://placehold.co/100x100/FFFFFF/3B82F6?text=AI"
        alt="Bot"
      />
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
