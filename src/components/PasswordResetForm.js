import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from "react-router-dom";
import '../css/PasswordResetForm.css';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Alert } from 'react-bootstrap';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function PasswordResetForm() {
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const query = useQuery();
    const uid = query.get('uid');
    const token = query.get('token');
    const navigate = useNavigate();

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            Password must be at least 8 characters long, include an uppercase letter and a number.
        </Tooltip>
    );
    
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`https://dot-bikerack-backend-1.onrender.com/reset-password/${uid}/${token}/`, { password, password2 })
            .then(response => {
                setMessage(response.data.message);
                setError('');
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // Redirect after 3 seconds
            }) 
            .catch(error => {
                console.error("There was an error resetting the password!", error);
                setError('There was an error resetting the password. Please try again.');
            }); 
    };

    const isFormValid = () => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return password.length >= 8 && password2.length >= 8 && password === password2 && hasUpperCase && hasNumber;
    };

    return (
        <div id="body" className="d-flex align-items-center py-4 bg-body-tertiary">
            <main className="form-signin w-100 m-auto">
                <h1 className="h3 mb-3 fw-normal">Set New Password</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <OverlayTrigger
                            placement="right"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderTooltip}
                        >
                            <input 
                                type="password" 
                                className="form-control" 
                                id="floatingInput" 
                                placeholder="New Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </OverlayTrigger>
                        <label htmlFor="floatingInput">New Password</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input 
                            type="password" 
                            className="form-control" 
                            id="floatingInput" 
                            placeholder="Confirm Password" 
                            value={password2} 
                            onChange={(e) => setPassword2(e.target.value)} 
                        />
                        <label htmlFor="floatingInput">Confirm Password</label>
                    </div>
                    <button className="btn btn-primary w-100 py-2" type="submit" disabled={!isFormValid()}>
                        Reset Password
                    </button>
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

export default PasswordResetForm;
