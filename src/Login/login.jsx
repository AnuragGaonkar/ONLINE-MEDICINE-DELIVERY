import React, { useState } from 'react';
import './login.css';

const LoginSignup = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Form Submitted. Username: ${username}, Password: ${password}`);
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
          type="text"
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
