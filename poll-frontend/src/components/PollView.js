import { AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { pollAPI } from '../services/api';

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

export default function PollView({ poll, onVote, onBack }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [voteError, setVoteError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  // Check if user has voted (both localStorage and server)
  const checkIfVoted = useCallback(async () => {
    try {
      // Check localStorage (frontend tracking)
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      const localVote = votedPolls[poll.id];

      // Check server (backend tracking)
      const response = await pollAPI.checkVoted(poll.id);
      const serverVoted = response.hasVoted;
      const serverVote = response.optionIndex;

      // If either says voted, mark as voted
      if (localVote !== undefined || serverVoted) {
        setHasVoted(true);
        setUserVote(localVote !== undefined ? localVote : serverVote);
      }
    } catch (err) {
      console.error('Error checking vote status:', err);
    }
  }, [poll.id]);

  useEffect(() => {
    checkIfVoted();
  }, [checkIfVoted]);

  const handleVote = async () => {
    if (selectedOption === null || hasVoted || poll.expired || isVoting) {
      return;
    }

    setIsVoting(true);
    setVoteError(null);

    try {
      // Cast vote on server
      await onVote(poll.id, selectedOption);
      
      // Save to localStorage (frontend tracking)
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      votedPolls[poll.id] = selectedOption;
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
      
      // Update state
      setHasVoted(true);
      setUserVote(selectedOption);
      setVoteError(null);
    } catch (error) {
      // Handle error (user already voted or other issues)
      const errorMessage = error.response?.data?.message || 'Failed to cast vote';
      setVoteError(errorMessage);
      
      // If server says already voted, update local state
      if (errorMessage.includes('already voted')) {
        setHasVoted(true);
        checkIfVoted(); // Re-check to get the actual vote
      }
    } finally {
      setIsVoting(false);
    }
  };

  const getPercentage = (votes) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="text-indigo-600 hover:text-indigo-800 mb-4 font-medium"
      >
        ← Back to Polls
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-2">{poll.question}</h2>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6 flex-wrap">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{poll.totalVotes || 0} total votes</span>
        </div>
        {poll.expiresAt && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              {poll.expired ? 'Expired' : `Expires ${getTimeRemaining(poll.expiresAt)}`}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {voteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{voteError}</p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-4 mb-6">
        {poll.options.map((option, index) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOption === index;
          const isUserVote = hasVoted && userVote === index;

          return (
            <div key={index} className="relative">
              <button
                onClick={() => !hasVoted && !poll.expired && setSelectedOption(index)}
                disabled={hasVoted || poll.expired || isVoting}
                className={`w-full text-left p-4 rounded-lg border-2 transition relative overflow-hidden ${
                  isSelected && !hasVoted
                    ? 'border-indigo-600 bg-indigo-50'
                    : hasVoted || poll.expired
                    ? 'border-gray-300 cursor-default'
                    : 'border-gray-300 hover:border-indigo-400'
                } ${isVoting ? 'opacity-50' : ''}`}
              >
                {/* Progress Bar Background */}
                {(hasVoted || poll.expired) && (
                  <div
                    className="absolute inset-0 bg-indigo-100 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                {/* Content */}
                <div className="relative flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    {isUserVote && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    <span className="font-medium text-gray-800">{option.text}</span>
                  </div>
                  {(hasVoted || poll.expired) && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{option.votes} votes</span>
                      <span className="font-bold text-indigo-600">{percentage}%</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Vote Button */}
      {!hasVoted && !poll.expired && (
        <button
          onClick={handleVote}
          disabled={selectedOption === null || isVoting}
          className={`w-full py-3 rounded-lg font-medium transition ${
            selectedOption !== null && !isVoting
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVoting ? 'Casting Vote...' : 'Cast Vote'}
        </button>
      )}

      {/* Success Message */}
      {hasVoted && !voteError && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Thanks for voting!</p>
          <p className="text-sm text-gray-600 mt-1">Your vote has been recorded</p>
        </div>
      )}

      {/* Expired Message */}
      {poll.expired && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 font-medium">This poll has expired</p>
        </div>
      )}
    </div>
  );
}