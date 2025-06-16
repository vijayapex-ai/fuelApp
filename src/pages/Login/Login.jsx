import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../contextApi/UserContext';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { login } = useUser();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    username: '',
    password: '',
    shiftNo: '1',
    shiftDate: today,
  });

  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const matchedUser = users.find(
      user => user.username === form.username && user.password === form.password
    );

    if (matchedUser) {
      const userRole = matchedUser.role;
      setRole(userRole);  // Set the role for date restriction

      // Check date restriction for normal users
      if (userRole === 'normal') {
        if (form.shiftDate > today || form.shiftDate < yesterday) {
          alert('Normal users can only select today or yesterday.');
          return;
        }
      }

      // Log the user in if the date is valid
      login({
        username: matchedUser.username,
        role: userRole,
        shiftNo: form.shiftNo,
        shiftDate: form.shiftDate,
      });

      if (onLogin) onLogin(matchedUser);
      navigate('/home');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Login</h2>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Shift No</label>
          <select
            value={form.shiftNo}
            onChange={(e) => handleChange('shiftNo', e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            required
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-600 mb-1">Shift Date</label>
          <input
            type="date"
            value={form.shiftDate}
            onChange={(e) => handleChange('shiftDate', e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
