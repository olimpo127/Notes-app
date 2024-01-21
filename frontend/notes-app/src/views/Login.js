import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import config from "../utils/Config";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    email: "",
    password: "",
    secret: config.jwtSecret,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("jwtToken", data.token);
          navigate("/Notes");
        } else {
          setErrorMessage("Invalid email or password. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage("An error occurred. Please try again later.");
      });
  };

  return (
    <div className="container">
      <div className="login">
      
      <form className="login-form" onSubmit={handleSubmit}>
      <h1>Login</h1>
        <div>
          <input
            type="text"
            name="email"
            value={user.email}
            onChange={handleInputChange}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            value={user.password}
            onChange={handleInputChange}
            placeholder="Password"
            required
          />
        </div>
        {errorMessage && <p className="errorMessage">{errorMessage}</p>}
        <button type="submit" className="loginButton" style={{backgroundColor: "blue"}}>
          Login
        </button>
      </form>
    </div>
    </div>
    
  );
}

export default Login;
