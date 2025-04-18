const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Add bcrypt import here

const app = express();
const PORT = 5555;

const corsOpt = {
  origin: true, // Allow any origin during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOpt));
app.use(express.json()); // Parse JSON

// Test route
app.get('/', (req, res) => {
  res.send('✅ Server is alive');
});

// Dummy user database
const users = {
  'admin': {
    passwordHash: bcrypt.hashSync('admin', 10),
    typingProfile: {
      dwellTimes: [100, 80, 90],
      flightTimes: [120, 100],
      maxErrorRate: 0.05,
    }
  }
};

// Helper: Calculate dwell times from timingData
function calculateDwellTimes(timingData) {
  const dwellTimes = [];
  const keyDownMap = {};
  timingData.forEach(event => {
    if (event.type === 'keydown') {
      keyDownMap[event.key] = event.time;
    } else if (event.type === 'keyup' && keyDownMap[event.key]) {
      const dwell = event.time - keyDownMap[event.key];
      dwellTimes.push(dwell);
      delete keyDownMap[event.key];
    }
  });
  return dwellTimes;
}

// Helper: Compare arrays (average difference)
function compareArrays(arr1, arr2) {
  if (arr1.length !== arr2.length) return Infinity;
  let totalDiff = 0;
  for (let i = 0; i < arr1.length; i++) {
    totalDiff += Math.abs(arr1[i] - arr2[i]);
  }
  return totalDiff / arr1.length;
}

app.post('/login', (req, res) => {
  const { email, password, timingData, flightTimes, errorRate } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ message: 'User not found' });
  
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Incorrect password' });
  }
  
  const inputDwellTimes = calculateDwellTimes(timingData);
  const dwellDiff = compareArrays(inputDwellTimes, user.typingProfile.dwellTimes);
  const flightDiff = compareArrays(
    flightTimes.map(f => f.flightTime),
    user.typingProfile.flightTimes
  );
  
  console.log(`Dwell Diff: ${dwellDiff}, Flight Diff: ${flightDiff}, Error Rate: ${errorRate}`);
  
  if (dwellDiff < 100 && flightDiff < 120 && errorRate <= user.typingProfile.maxErrorRate) {
    return res.json({ message: 'Login Successful 🎯' });
  } else {
    return res.status(401).json({ message: 'Typing style mismatch ❌' });
  }
});

app.post('/register', (req, res) => {
  const { email, password, timingData, flightTimes, errorRate } = req.body;
  console.log('📥 Received registration request for:', email);
  
  if (users[email]) {
    console.log('⚠️ User already exists:', email);
    return res.status(400).json({ message: 'User already exists' });
  }
  
  if (!timingData || !flightTimes || timingData.length === 0 || flightTimes.length === 0) {
    console.log('❌ Missing or incomplete typing data');
    return res.status(400).json({ message: 'Typing data incomplete or missing' });
  }
  
  const passwordHash = bcrypt.hashSync(password, 10);
  const keyDownMap = {};
  const dwellTimes = [];
  
  timingData.forEach(event => {
    if (event.type === 'keydown') {
      keyDownMap[event.key] = event.time;
    } else if (event.type === 'keyup' && keyDownMap[event.key]) {
      const dwell = event.time - keyDownMap[event.key];
      dwellTimes.push(dwell);
      delete keyDownMap[event.key];
    }
  });
  
  users[email] = {
    passwordHash,
    typingProfile: {
      dwellTimes,
      flightTimes: flightTimes.map(f => f.flightTime),
      maxErrorRate: errorRate
    }
  };

  console.log('✅ Registered new user:', email);
  res.json({ message: 'User registered successfully!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});