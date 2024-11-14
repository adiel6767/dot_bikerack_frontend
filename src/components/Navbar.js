import React, {useState, useEffect} from 'react';
import '../css/Navbar.css';
import { useUser } from './UserContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
    baseURL: "https://dot-bikerack-backend-1.onrender.com/"
})

function Navbar(){
const [is_staff, setIsStaff] = useState(false)
const navigate  = useNavigate();
const {logout} = useUser();
const userData = JSON.parse(localStorage.getItem('userData'));
// console.log(userData.is_staff)
const { currentUser } = useUser();

useEffect(() => {
  // If userData is null, do nothing
  if (userData === null) {
    return; // Early exit if userData is null
  }

  // If userData is defined, check if is_staff exists
  if (userData && typeof userData.is_staff !== 'undefined') {
    setIsStaff(userData.is_staff);
  }
}, [userData]); // Runs this effect whenever userData changes

const handleLogout = (e) => {
  e.preventDefault();
  
  // Retrieve tokens from local storage
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (accessToken && refreshToken) {
      const config = {
          headers: {
              "Authorization": `Bearer ${accessToken}`
          }
      };

      // Make the logout request
      client.post(
          'logout/',
          { "refresh": refreshToken }, 
          config 
      )
      .then((res) => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userData");

          logout(); // This function should handle any state updates for logging out
          navigate('/login'); // Redirect to the login page

          console.log("Log out successful!");
      })
      .catch((error) => {
          console.error("Failed to logout", error.response?.data || error.message);
      });
  } else {
      console.error("No tokens found, unable to logout.");
  }
};

return (
  <header>
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      {userData ? (
        <a className="navbar-brand" href="#" style={{ marginLeft: "10px" }}>
          {userData.username}
        </a>
      ) : (
        <a className="navbar-brand" href="#" style={{ marginLeft: "10px" }}>
          Bike Rack App
        </a>
      )}
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav">
          <li className="nav-item active">
            <a className="nav-link" href="/home">
              Home
            </a>
          </li>
          {currentUser ? null : (
            <li className="nav-item">
              <a className="nav-link" href="/login">
                Login
              </a>
            </li>
          )}
          {currentUser ? (
            <li className="nav-item">
              <a className="nav-link" href="/main">
                Main
              </a>
            </li>
          ) : null}
          {currentUser && is_staff ? (
            <li className="nav-item">
              <a className="nav-link" href="/data">
                Data
              </a>
            </li>
          ) : null}
          {currentUser ? null : (
            <li className="nav-item">
              <a className="nav-link" href="/register">
                Register
              </a>
            </li>
          )}
          {currentUser ? (
            <li className="nav-item">
              <a className="nav-link" href="/logout" onClick={handleLogout}>
                Logout
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  </header>
);
}

export default Navbar;