import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate  } from 'react-router-dom';
import '../css/ResetCredentials.css';

const ResetCredentials = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate   = useNavigate ();

    const query = new URLSearchParams(location.search);
    const uid = query.get('uid');
    const token = query.get('token');

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`https://dot-bikerack-backend-1.onrender.com/reset-credentials/${uid}/${token}/`, { username, email })
            .then(response => {
                setMessage(response.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            })
            .catch(error => {
                setMessage('Error updating credentials. Please try again.');
                console.error(error);
            });
    };

    return (
        <div id="body" className="d-flex align-items-center py-4 bg-body-tertiary">
            <main className="form-signin w-100 m-auto">
                <h2 className="h3 mb-3 fw-normal">Reset Credentials</h2>
                <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                    <label htmlFor="floatingUsername">New Username</label>
                    <input 
                    type="text" 
                    className="form-control" 
                    id="floatingUsername" 
                    placeholder="New Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    />
                </div>
                <div className="form-floating mb-3">
                    <label htmlFor="floatingEmail">New Email</label>
                    <input 
                    type="email" 
                    className="form-control" 
                    id="floatingEmail" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    />
                </div>
                <button className="btn btn-primary w-100 py-2" type="submit">Reset Credentials</button>
                </form>
                {message && <p>{message}</p>}
            </main>
        </div>
    );
};

export default ResetCredentials;
