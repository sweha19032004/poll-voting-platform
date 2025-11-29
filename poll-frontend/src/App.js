import { BarChart3, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';
import PollView from './components/PollView';
import { pollAPI } from './services/api';

export default function App() {
  const [polls, setPolls] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load polls from backend
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pollAPI.getAllPolls();
      setPolls(response.data);
    } catch (err) {
      setError('Failed to load polls. Make sure the backend server is running.');
      console.error('Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (pollData) => {
    try {
      setError(null);
      const response = await pollAPI.createPoll(pollData);
      setPolls([response.data, ...polls]);
      setActiveView('list');
    } catch (err) {
      setError('Failed to create poll');
      console.error('Error creating poll:', err);
    }
  };

  const castVote = async (pollId, optionIndex) => {
    try {
      setError(null);
      const response = await pollAPI.castVote(pollId, optionIndex);
      
      // Update polls list
      setPolls(polls.map(p => p.id === pollId ? response.data : p));
      
      // Update selected poll
      if (selectedPoll && selectedPoll.id === pollId) {
        setSelectedPoll(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cast vote');
      console.error('Error casting vote:', err);
    }
  };

  const viewPoll = async (poll) => {
    try {
      setError(null);
      // Fetch fresh poll data
      const response = await pollAPI.getPoll(poll.id);
      setSelectedPoll(response.data);
      setActiveView('view');
    } catch (err) {
      setError('Failed to load poll details');
      console.error('Error loading poll:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Poll & Voting Platform</h1>
            </div>
            {activeView === 'list' && (
              <button
                onClick={() => setActiveView('create')}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create Poll</span>
              </button>
            )}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <>
            {activeView === 'list' && (
              <PollList 
                polls={polls} 
                onViewPoll={viewPoll}
                onRefresh={loadPolls}
              />
            )}

            {activeView === 'create' && (
              <CreatePoll 
                onCreatePoll={createPoll}
                onCancel={() => setActiveView('list')}
              />
            )}

            {activeView === 'view' && selectedPoll && (
              <PollView
                poll={selectedPoll}
                onVote={castVote}
                onBack={() => {
                  setActiveView('list');
                  loadPolls(); // Refresh polls list
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}