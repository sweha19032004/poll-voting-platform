const express = require('express');
const router = express.Router();
const {
  getAllPolls,
  getPoll,
  createPoll,
  castVote,
  checkVoted,
  deletePoll
} = require('../controllers/pollController');

// Poll CRUD routes
router.get('/', getAllPolls);
router.get('/:id', getPoll);
router.post('/', createPoll);
router.delete('/:id', deletePoll);

// Voting routes
router.put('/:id/vote', castVote);
router.get('/:id/voted', checkVoted);

module.exports = router;