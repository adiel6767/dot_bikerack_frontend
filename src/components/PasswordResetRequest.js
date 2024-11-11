import React, { useState } from "react";
import axios from 'axios';
import '../css/PasswordResetRequest.css'; 
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

function PasswordResetRequest() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://127.0.0.1:8000/password-reset-request/', { email })
            .then(response => {
                setMessage(response.data.message);
                setError('');
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // Redirect after 3 seconds
            })
            .catch(error => {
                console.error("There was an error resetting the password!", error);
                setError(error.response.data.email[0] || 'There was an error resetting the password. Please try again.');
            }); 
    };

    return (
        <div id="body" className="d-flex align-items-center py-4 bg-body-tertiary">
            <main className="form-signin w-100 m-auto">
                <form onSubmit={handleSubmit}>
                    <h1 className="h3 mb-3 fw-normal">Reset Password</h1>
                    <div className="form-floating">
                        <input 
                            type="email" 
                            className="form-control" 
                            id="floatingInput" 
                            placeholder="name@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label htmlFor="floatingInput">Email</label>
                    </div>
                    <button className="btn btn-primary w-100 py-2" type="submit">Send Password Reset Link</button>
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

export default PasswordResetRequest;
