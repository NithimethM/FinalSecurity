const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); 

const app = express();
const PORT = 5555;

const corsOpt = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOpt));
app.use(express.json()); 

// Test route
app.get('/', (req, res) => {
  res.send('✅ Server is alive');
});

// admin user
const users = {
  'admin': {
    passwordHash: bcrypt.hashSync('admin', 10),
    typingProfile: {
      dwellTimes: [55, 55, 55, 55, 55],  // milliseconds
      flightTimes: [100, 100, 100, 100, 100],  // milliseconds
      maxErrorRate: 0.05,
    }
  }
};

// Calculate dwell times from timingData
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

// Compare two arrays (like flight times during login and registration) 
function compareArrays(arr1, arr2) {
  const minLen = Math.min(arr1.length, arr2.length);
  if (minLen === 0) return Infinity;

  let totalDiff = 0;
  for (let i = 0; i < minLen; i++) {
    totalDiff += Math.abs(arr1[i] - arr2[i]);
  }
  return totalDiff / minLen;
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

  const sumDwellTimes = user.typingProfile.dwellTimes.reduce((acc, val) => acc + val, 0);
  const avgDwellTimes = sumDwellTimes / user.typingProfile.dwellTimes.length;
  const sumFlightTimes = user.typingProfile.flightTimes.reduce((acc, val) => acc + val, 0);
  const avgFlightTimes = sumFlightTimes / user.typingProfile.flightTimes.length;
  const dwellThreshold = avgDwellTimes * 1.25; //make it 25% slower possible
  const flightThreshold = avgFlightTimes * 1.1;

  if (dwellDiff <= dwellThreshold && flightDiff <= flightThreshold && errorRate <= user.typingProfile.maxErrorRate + 0.05) {
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