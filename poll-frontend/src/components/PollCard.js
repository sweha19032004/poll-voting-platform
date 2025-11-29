import { Clock, Users } from 'lucide-react';

const getTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  return `in ${minutes}m`;
};

export default function PollCard({ poll, onViewPoll }) {
  const totalVotes = poll.totalVotes || 0;
  const timeLeft = poll.expiresAt ? getTimeRemaining(poll.expiresAt) : null;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer ${poll.expired ? 'opacity-75' : ''}`}
      onClick={() => onViewPoll(poll)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-800 flex-1">{poll.question}</h3>
        {poll.expired && (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded ml-2">Expired</span>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{totalVotes} votes</span>
        </div>
        {timeLeft && !poll.expired && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
}