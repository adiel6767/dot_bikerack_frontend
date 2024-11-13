import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/ForgotCredentials.css';
import { Alert } from 'react-bootstrap';

function ForgotCredentials() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();


    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('https://dot-bikerack-backend-1.onrender/forgot-credentials/', { email })
            .then(response => {
                setMessage(response.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // Redirect after 3 seconds
                setError('');
            })
            .catch(error => {
                console.error("There was an error!", error);
                setError('There was an error processing your request. Please try again.');
            });
    };

    return (
        <div id="body" className="d-flex align-items-center py-4 bg-body-tertiary">
            <main className="form-signin w-100 m-auto">
                <h1 className="h3 mb-3 fw-normal">Forgot Credentials</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-floating">
                        <input 
                            type="email" 
                            className="form-control mb-3" 
                            id="floatingInput" 
                            placeholder="name@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label htmlFor="floatingInput">Email</label>
                    </div>
                    <button className="btn btn-primary w-100 py-2" type="submit">Submit</button>
                </form>
                {message && 
                    <Alert variant="success" className="mt-3">
                        {message}
                    </Alert>
                }
                {error && 
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                }
            </main>
        </div>
    );
}

export default ForgotCredentials;
