import React, { useState } from "react";
import axios from 'axios';
import '../css/Register.css';
import { useUser } from './UserContext'
import {useNavigate} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import Home from "./Home";


axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
    baseURL: "https://dot-bikerack-backend-1.onrender.com/"
    // baseURL: "http://127.0.0.1:8000/"
})

function Register() {
    const navigate = useNavigate();
    const [currentUser] = useState(false);
    const [username, setUsername] = useState('')
    const [phone_number, setPhoneNumber ] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    const [agreeToTerms, setAgreeToTerms] = useState('')

    const { login } = useUser()
    
    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    }
    
    const handlePhoneNumberChange = (event) => {
        setPhoneNumber(event.target.value);
    }

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const handlePasswordChange = (event) => {
        setPassword(event.target.value)
    }

    const handleRepeatPassword = (event) => {
        setRepeatPassword(event.target.value)
    }

    const handleAgreeToTerms = (event) => {
        const isChecked = event.target.checked
        setAgreeToTerms(isChecked)
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }


    function submitRegistration(e) {
        e.preventDefault();
        const csrfToken = getCookie('csrftoken');

        client.post(
            "register/",
            {
                username: username,
                email: email,
                phone_number: phone_number,
                password: password,
                password2: repeatPassword
            },{
                headers: {
                    'X-CSRFToken': csrfToken
                }
            }
        ).then(function(res) {
            // Registration successful, now perform login
            console.log(res)
            localStorage.setItem('email', email);
            navigate("/onboarding")

        }).catch(function(error) {
          if (error.response) {
            const contentType = error.response.headers["content-type"];
    
            // Handle JSON responses
            if (contentType && contentType.includes("application/json")) {
                const jsonData = error.response.data;
    
                // Collect all error messages from the JSON response
                let errorMessages = [];
                for (const key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        const value = jsonData[key];
    
                        // Handle arrays, objects, or single values
                        if (Array.isArray(value)) {
                            errorMessages.push(...value); // Add array elements to messages
                        } else if (typeof value === "object") {
                            // If nested object, flatten it (optional)
                            errorMessages.push(JSON.stringify(value));
                        } else {
                            errorMessages.push(value); // Single value
                        }
                    }
                }
    
                // Combine all error messages into one string
                const combinedErrorMessage = errorMessages.join(", ");
    
                if (combinedErrorMessage) {
                    console.log("Extracted Error Messages (JSON):", combinedErrorMessage);
                    toast.error(`Error: ${combinedErrorMessage}`);
                } else {
                    console.error("No error messages found in JSON response.");
                    toast.error("Error: Something went wrong.");
                }
            }
            // Handle HTML responses
            else if (contentType && contentType.includes("text/html")) {
                const html = error.response.data;
    
                // Parse the HTML using DOMParser
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
    
                // Extract the content of the <pre> tag with class "exception_value"
                let exceptionValue = doc.querySelector("pre.exception_value")?.textContent;
    
                if (exceptionValue) {
                    // Clean up brackets and quotes
                    exceptionValue = exceptionValue.replace(/[\[\]']/g, "").trim();
    
                    console.log("Extracted Exception Value (HTML):", exceptionValue);
                    toast.error(`Error: ${exceptionValue}`);
                } else {
                    console.error("Could not find exception value in HTML response.");
                    toast.error("Error: Something went wrong.");
                }
            } else {
                console.error("Unknown response type.");
                toast.error("Error: Something went wrong.");
            }
        } else {
            // Handle other errors (e.g., network issues)
            console.error("Error occurred:", error.message);
            toast.error("Error: Something went wrong.");
        }
        });
    }
    
    if(currentUser){
        return <Home />
    }

    return (
        <div className="register bg-body-tertiary">
          <ToastContainer /> 
          <section className="vh-100">
            <div className="container h-100">
              <div className="row d-flex justify-content-center align-items-center h-100">
                <div className="col-lg-6 col-md-8">
                  <div
                    className="card"
                    style={{ borderRadius: "25px" }}
                  >
                    <div className="card-body p-md-5">
                      <p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">
                        Sign up
                      </p>
                      <form
                        className="mx-1 mx-md-4"
                        onSubmit={(e) => submitRegistration(e)}
                      >
                        <div className="d-flex flex-row align-items-center mb-4">
                          <div className="form-outline flex-fill mb-0">
                            <input
                              type="text"
                              name="Username"
                              id="form3Example1c"
                              className="form-control"
                              placeholder="Username"
                              value={username}
                              onChange={handleUsernameChange}
                            />
                          </div>
                        </div>
                        <div className="d-flex flex-row align-items-center mb-4">
                          <div className="form-outline flex-fill mb-0">
                            <input
                              type="tel"
                              name="Phone Number (optional)"
                              id="form3Example1c"
                              className="form-control"
                              placeholder="Phone Number (optional)"
                              value={phone_number}
                              onChange={handlePhoneNumberChange}
                            />
                          </div>
                        </div>
                        <div className="d-flex flex-row align-items-center mb-4">
                          <div className="form-outline flex-fill mb-0">
                            <input
                              type="email"
                              name="email"
                              id="form3Example3c"
                              className="form-control"
                              placeholder="Email"
                              value={email}
                              onChange={handleEmailChange}
                            />
                          </div>
                        </div>
                        <div className="d-flex flex-row align-items-center mb-4">
                          <div className="form-outline flex-fill mb-0">
                            <input
                              type="password"
                              name="password"
                              id="form3Example4c"
                              className="form-control"
                              placeholder="Password"
                              value={password}
                              onChange={handlePasswordChange}
                            />
                          </div>
                        </div>
                        <div className="d-flex flex-row align-items-center mb-4">
                          <div className="form-outline flex-fill mb-0">
                            <input
                              type="password"
                              name="repeatPassword"
                              id="form3Example4cd"
                              className="form-control"
                              placeholder="Repeat Password"
                              value={repeatPassword}
                              onChange={handleRepeatPassword}
                            />
                          </div>
                        </div>
                        <div className="form-check d-flex justify-content-center mb-5">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            value={agreeToTerms}
                            id="form2Example3c"
                            onChange={handleAgreeToTerms}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="form2Example3"
                          >
                            I agree to all statements in{" "}
                            <a href="#!">Terms of Service</a>
                          </label>
                        </div>
                        <div className="d-flex justify-content-center mx-4 mb-3 mb-lg-4">
                          <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                          >
                            Register
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
}

export default Register;
