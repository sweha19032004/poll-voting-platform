const fs = require('fs');
const path = require('path');

const POLLS_FILE = path.join(__dirname, '../data/polls.json');
const VOTES_FILE = path.join(__dirname, '../data/votes.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Read polls from file
const readPolls = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(POLLS_FILE)) {
      fs.writeFileSync(POLLS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(POLLS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading polls:', error);
    return [];
  }
};

// Write polls to file
const writePolls = (polls) => {
  try {
    ensureDataDir();
    fs.writeFileSync(POLLS_FILE, JSON.stringify(polls, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing polls:', error);
    return false;
  }
};

// Read votes from file
const readVotes = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(VOTES_FILE)) {
      fs.writeFileSync(VOTES_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    const data = fs.readFileSync(VOTES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading votes:', error);
    return {};
  }
};

// Write votes to file
const writeVotes = (votes) => {
  try {
    ensureDataDir();
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing votes:', error);
    return false;
  }
};

module.exports = {
  readPolls,
  writePolls,
  readVotes,
  writeVotes
};