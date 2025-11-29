import { RefreshCw } from 'lucide-react';
import PollCard from './PollCard';

export default function PollList({ polls, onViewPoll, onRefresh }) {
  const activePolls = polls.filter(p => !p.expired);
  const expiredPolls = polls.filter(p => p.expired);

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Polls */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Polls</h2>
        {activePolls.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No active polls yet. Create your first poll!
          </div>
        ) : (
          <div className="grid gap-4">
            {activePolls.map(poll => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onViewPoll={onViewPoll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expired Polls */}
      {expiredPolls.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Expired Polls</h2>
          <div className="grid gap-4">
            {expiredPolls.map(poll => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onViewPoll={onViewPoll}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}