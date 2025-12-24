// LoginSignup.jsx
import React, { useState } from "react";
import "./login.css";

const LoginSignup = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [contactNumber, setContactNumber] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const HOST = "http://localhost:5001";

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetFields();
  };

  const Alert = ({ message, onClose }) => {
    return (
      <div className="alert" style={{ zIndex: 1001 }}>
        <span>{message}</span>
        <button onClick={onClose} className="close-alert">
          ×
        </button>
      </div>
    );
  };

  const resetFields = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setAddress({ street: "", city: "", postalCode: "", country: "" });
    setContactNumber("");
  };

  const validateLogin = () => {
    if (!email || !password) {
      alert("Please fill in all fields.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const validateSignup = () => {
    if (
      !username ||
      !email ||
      !password ||
      !contactNumber ||
      !address.street ||
      !address.city ||
      !address.postalCode ||
      !address.country
    ) {
      alert("Please fill in all fields.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      // SIGN UP
      if (!validateSignup()) return;

      try {
        const response = await fetch(`${HOST}/api/auth/createuser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: username,
            email,
            password,
            contactNumber,
            address,
            role: "user",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.authToken) {
          console.log("Sign up failed", data);
          setAlertMessage("Sign up failed. Please try again.");
          setTimeout(() => setAlertMessage(""), 3000);
          return;
        }

        // Persist token
        localStorage.setItem("auth-token", data.authToken);

        setAlertMessage("Account successfully created.");
        setTimeout(() => setAlertMessage(""), 3000);
        resetFields();

        // Inform Navbar with user + token
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.authToken);
        }
      } catch (error) {
        console.error("Error during sign-up:", error);
        setAlertMessage("Sign up error. Please try again.");
        setTimeout(() => setAlertMessage(""), 3000);
      }
    } else {
      // LOGIN
      if (!validateLogin()) return;

      try {
        const url = `${HOST}/api/auth/login`;
        const loginData = { email, password };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        });

        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.authToken) {
          setAlertMessage("Failed to log in.");
          setTimeout(() => setAlertMessage(""), 3000);
          return;
        }

        // Persist token
        localStorage.setItem("auth-token", data.authToken);

        setAlertMessage("Successfully logged in.");
        setTimeout(() => setAlertMessage(""), 3000);

        // Notify parent
        if (onLoginSuccess) {
          // We don't have user details here; Navbar will refetch them using token
          onLoginSuccess(null, data.authToken);
        }

        // Handle "add to cart after login" flow
        const state = window.history.state?.usr;
        if (state?.productToAdd) {
          const { medicineId, qty } = state.productToAdd;
          try {
            const addResponse = await fetch(
              `${HOST}/api/cart/add/${medicineId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "auth-token": data.authToken,
                },
                body: JSON.stringify({ quantity: qty || 1 }),
              }
            );
            if (!addResponse.ok) {
              console.log("Add to cart after login failed");
            }
          } catch (err) {
            console.error("Error during post-login add to cart:", err);
          }
        }

        window.location.href = state?.from || "/";
      } catch (error) {
        console.log("Could not login", error);
        setAlertMessage("Login error. Please try again.");
        setTimeout(() => setAlertMessage(""), 3000);
      }
    }
  };

  return (
    <div className="form-container">
      <p className="title">
        {isSignUp ? "Create an account" : "Welcome back"}
      </p>
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
              onChange={(e) =>
                setAddress({ ...address, street: e.target.value })
              }
              required
            />
            <input
              type="text"
              className="input"
              placeholder="City"
              value={address.city}
              onChange={(e) =>
                setAddress({ ...address, city: e.target.value })
              }
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Postal Code"
              value={address.postalCode}
              onChange={(e) =>
                setAddress({ ...address, postalCode: e.target.value })
              }
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Country"
              value={address.country}
              onChange={(e) =>
                setAddress({ ...address, country: e.target.value })
              }
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
          {isSignUp ? "Sign Up" : "Log in"}
        </button>
      </form>
      <p className="sign-up-label">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <span className="sign-up-link" onClick={toggleMode}>
          {isSignUp ? "Log in" : "Sign up"}
        </span>
      </p>

      {alertMessage && (
        <Alert message={alertMessage} onClose={() => setAlertMessage("")} />
      )}
    </div>
  );
};

export default LoginSignup;
