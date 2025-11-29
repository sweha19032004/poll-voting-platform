const { readPolls, writePolls, readVotes, writeVotes } = require('../utils/fileHandler');

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Check and mark expired polls
const checkExpiredPolls = (polls) => {
  const now = new Date();
  return polls.map(poll => {
    if (poll.expiresAt && new Date(poll.expiresAt) <= now && !poll.expired) {
      return { ...poll, expired: true };
    }
    return poll;
  });
};

// @desc    Get all polls
// @route   GET /api/polls
// @access  Public
exports.getAllPolls = (req, res) => {
  try {
    const { status } = req.query;
    let polls = readPolls();
    
    // Check and update expired polls
    polls = checkExpiredPolls(polls);
    writePolls(polls);

    // Filter by status
    if (status === 'active') {
      polls = polls.filter(p => !p.expired);
    } else if (status === 'expired') {
      polls = polls.filter(p => p.expired);
    }

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    console.error('Error in getAllPolls:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Public
exports.getPoll = (req, res) => {
  try {
    let polls = readPolls();
    polls = checkExpiredPolls(polls);
    writePolls(polls);

    const poll = polls.find(p => p.id === req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.status(200).json({
      success: true,
      data: poll
    });
  } catch (error) {
    console.error('Error in getPoll:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new poll
// @route   POST /api/polls
// @access  Public
exports.createPoll = (req, res) => {
  try {
    const { question, options, expiresAt } = req.body;

    // Validation
    if (!question || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question and at least 2 options'
      });
    }

    // Create poll object
    const newPoll = {
      id: generateId(),
      question,
      options: options.map(opt => ({
        text: typeof opt === 'string' ? opt : opt.text,
        votes: 0
      })),
      totalVotes: 0,
      expiresAt: expiresAt || null,
      expired: false,
      createdAt: new Date().toISOString()
    };

    // Save to file
    const polls = readPolls();
    polls.unshift(newPoll);
    writePolls(polls);

    console.log('✅ Poll created:', newPoll.id, '-', newPoll.question);

    res.status(201).json({
      success: true,
      data: newPoll
    });
  } catch (error) {
    console.error('Error in createPoll:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cast vote on a poll
// @route   PUT /api/polls/:id/vote
// @access  Public
exports.castVote = (req, res) => {
  try {
    const { optionIndex } = req.body;
    const pollId = req.params.id;
    
    // Get user's IP address for server-side tracking
    const voterIp = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection.remoteAddress || 
                    'unknown';

    console.log('📊 Vote attempt from IP:', voterIp, '| Poll:', pollId, '| Option:', optionIndex);

    // Read data
    let polls = readPolls();
    let votes = readVotes();

    // Check expired polls
    polls = checkExpiredPolls(polls);
    writePolls(polls);

    // Find poll
    const pollIndex = polls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const poll = polls[pollIndex];

    // Check if expired
    if (poll.expired) {
      return res.status(400).json({
        success: false,
        message: 'This poll has expired'
      });
    }

    // Initialize votes object for this poll if it doesn't exist
    if (!votes[pollId]) {
      votes[pollId] = {};
    }

    // Check if this IP has already voted (SERVER-SIDE PROTECTION)
    if (votes[pollId][voterIp] !== undefined) {
      console.log('⚠️ Vote rejected - IP already voted:', voterIp);
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }

    // Validate option index
    if (optionIndex === undefined || optionIndex === null || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // Cast vote
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    
    // Store voter IP with their vote
    votes[pollId][voterIp] = {
      optionIndex: optionIndex,
      timestamp: new Date().toISOString()
    };

    // Save data
    polls[pollIndex] = poll;
    writePolls(polls);
    writeVotes(votes);

    console.log('✅ Vote cast successfully | Total votes:', poll.totalVotes);

    res.status(200).json({
      success: true,
      message: 'Vote cast successfully',
      data: poll
    });
  } catch (error) {
    console.error('Error in castVote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check if user has voted
// @route   GET /api/polls/:id/voted
// @access  Public
exports.checkVoted = (req, res) => {
  try {
    const pollId = req.params.id;
    const voterIp = req.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection.remoteAddress || 
                    'unknown';

    const votes = readVotes();
    const pollVotes = votes[pollId] || {};
    const userVote = pollVotes[voterIp];
    
    const hasVoted = userVote !== undefined;
    const optionIndex = hasVoted ? userVote.optionIndex : null;

    res.status(200).json({
      success: true,
      hasVoted,
      optionIndex
    });
  } catch (error) {
    console.error('Error in checkVoted:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Public
exports.deletePoll = (req, res) => {
  try {
    let polls = readPolls();
    const pollIndex = polls.findIndex(p => p.id === req.params.id);

    if (pollIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const deletedPoll = polls[pollIndex];
    polls.splice(pollIndex, 1);
    writePolls(polls);

    // Also remove votes for this poll
    let votes = readVotes();
    if (votes[req.params.id]) {
      delete votes[req.params.id];
      writeVotes(votes);
    }

    console.log('🗑️ Poll deleted:', req.params.id, '-', deletedPoll.question);

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePoll:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get poll statistics
// @route   GET /api/polls/:id/stats
// @access  Public
exports.getPollStats = (req, res) => {
  try {
    const pollId = req.params.id;
    const polls = readPolls();
    const votes = readVotes();
    
    const poll = polls.find(p => p.id === pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const pollVotes = votes[pollId] || {};
    const uniqueVoters = Object.keys(pollVotes).length;

    res.status(200).json({
      success: true,
      data: {
        pollId: poll.id,
        question: poll.question,
        totalVotes: poll.totalVotes,
        uniqueVoters: uniqueVoters,
        options: poll.options.map(opt => ({
          text: opt.text,
          votes: opt.votes,
          percentage: poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0
        })),
        expired: poll.expired,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in getPollStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};