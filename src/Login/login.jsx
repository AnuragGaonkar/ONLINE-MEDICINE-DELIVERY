import React, { useState } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import './login.css'

const LoginSignup = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [_, setCookies] = useCookies(['access_token']);
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setUsername('');
    setPassword('');
  };

  // Function to handle login or signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const api = isSignUp
        ? 'http://localhost:5000/auth/register'
        : 'http://localhost:5000/auth/login';

      const payload = { username, password };

      const res = await axios.post(api, payload);

      // Save access token in cookies and userID in local storage on successful login/signup
      setCookies('access_token', res.data.token);
      window.localStorage.setItem('userID', res.data.userID);
      alert("User Logged IN")
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="form-container">
      <p className="title">{isSignUp ? 'Create an account' : 'Welcome back'}</p>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="form-btn">
          {isSignUp ? 'Sign Up' : 'Log in'}
        </button>
      </form>
      <p className="sign-up-label">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <span className="sign-up-link" onClick={toggleMode}>
          {isSignUp ? 'Log in' : 'Sign up'}
        </span>
      </p>
    </div>
  );
};

export default LoginSignup;
