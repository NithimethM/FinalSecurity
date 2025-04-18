import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timingData, setTimingData] = useState([]);
  const [flightTimes, setFlightTimes] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);

  const lastKeyUpTime = useRef(null);
  const lastKey = useRef(null);
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    const now = Date.now();
    const key = e.key;
    setTimingData(prev => [...prev, { key, type: 'keydown', time: now }]);

    if (lastKeyUpTime.current !== null) {
      const flightTime = now - lastKeyUpTime.current;
      setFlightTimes(prev => [...prev, { from: lastKey.current, to: key, flightTime }]);
    }

    if (key === 'Backspace' || key === 'Delete') {
      setErrorCount(prev => prev + 1);
    }

    setTotalKeysPressed(prev => prev + 1);
  };

  const handleKeyUp = (e) => {
    const now = Date.now();
    const key = e.key;
    setTimingData(prev => [...prev, { key, type: 'keyup', time: now }]);
    lastKeyUpTime.current = now;
    lastKey.current = key;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('http://localhost:5555/register', {
        email,
        password,
        timingData,
        flightTimes,
        errorRate: errorCount / totalKeysPressed,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false
      });
      alert('Registration successful!');
      navigate('/');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Register</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors">
            Register
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?
          <button onClick={() => navigate('/')} className="ml-1 text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
