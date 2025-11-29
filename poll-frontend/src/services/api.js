import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Poll API calls
export const pollAPI = {
  // Get all polls
  getAllPolls: async (status = '') => {
    const response = await api.get(`/polls${status ? `?status=${status}` : ''}`);
    return response.data;
  },

  // Get single poll
  getPoll: async (id) => {
    const response = await api.get(`/polls/${id}`);
    return response.data;
  },

  // Create new poll
  createPoll: async (pollData) => {
    const response = await api.post('/polls', pollData);
    return response.data;
  },

  // Cast vote
  castVote: async (pollId, optionIndex) => {
    const response = await api.put(`/polls/${pollId}/vote`, { optionIndex });
    return response.data;
  },

  // Check if user has voted
  checkVoted: async (pollId) => {
    const response = await api.get(`/polls/${pollId}/voted`);
    return response.data;
  },

  // Delete poll
  deletePoll: async (pollId) => {
    const response = await api.delete(`/polls/${pollId}`);
    return response.data;
  },
};

export default api;