import React, { useState } from 'react';
import './login.css';

const LoginSignup = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', postalCode: '', country: '' });
  const [contactNumber, setContactNumber] = useState('');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetFields();
  };

  const resetFields = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setAddress({ street: '', city: '', postalCode: '', country: '' });
    setContactNumber('');
  };

  const validateLogin = () => {
    if (!email || !password) {
      alert("Please fill in all fields.");
      return false;
    }

    // Simple email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const validateSignup = () => {
    if (!username || !email || !password || !contactNumber || !address.street || !address.city || !address.postalCode || !address.country) {
      alert("Please fill in all fields.");
      return false;
    }

    // Simple email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (isSignUp) {
      if (!validateSignup()) return;
      try {
        const HOST = "http://localhost:5001";
        const response = await fetch(`${HOST}/api/auth/createuser`, { // Adjust the URL according to your API setup
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: username,
            email,
            password,
            contactNumber,
            address,
            role: 'user', // Assuming a default role; you can modify as necessary
          }),
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          console.log("Sign up failed")
        } else {
          alert("Sign up successfull")
          localStorage.setItem("authToken", data.authToken)
          resetFields(); // Reset fields on successful signup
        }
      } catch (error) {
        console.error("Error during sign-up:", error);
      }
    } else {
      if (!validateLogin()) return;
      const HOST = "http://localhost:5001";
      try {
        const url = `${HOST}/api/auth/login`;
  
        // Login credentials
        const loginData = {
          email,
          password,
        };
  
        // Send the form data to the backend (adjust the URL as needed)
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(loginData),
        });
  
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
  
        const data = await response.json();
        // Assume the response contains an auth token
        if (data.authToken) {
          localStorage.setItem('authToken', data.authToken);
          alert("Logged in successfully")
        } else {
          alert("Invalid Login Credentials");
        }
      } catch (error) {
        // Handle error response
        console.log("Could not login", error)
      }
    }
  };

  return (
    <div className="form-container">
      <p className="title">{isSignUp ? 'Create an account' : 'Welcome back'}</p>
      <form className="form" onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
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
        {isSignUp && (
          <>
            <input
              type="text"
              className="input"
              placeholder="Street Address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Postal Code"
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Country"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
          </>
        )}
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
