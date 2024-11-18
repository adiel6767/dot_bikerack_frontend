import React from "react";
import axios from 'axios';

function RegisterSuccess() {
    const email = localStorage.getItem('email');
    
    const client = axios.create({
        baseURL: "https://dot-bikerack-backend-1.onrender.com/"
        // baseURL: "http://127.0.0.1:8000/"
    });

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function resendVerificationEmail(e) {
        e.preventDefault();  // Prevent the default link behavior
        const csrfToken = getCookie('csrftoken');
        client.post(
            "resend-verification-email/",
            { email: email },
            {
                headers: {
                    'X-CSRFToken': csrfToken
                }
            }
        ).then(function(res) {
            console.log("Verification email resent successfully.");
        }).catch(function(error) {
            console.error("Error resending verification email:", error);
        });
    }

    return (
        <div className="registersuccess">
            {email ? (
                <>
                    <h1>Verify your email</h1>
                    <div>
                        <p>We sent an email to {email}. Click the link inside to get started.</p>
                        <a href="#" onClick={resendVerificationEmail}>Resend email</a>
                    </div>
                </>
            ) : (
                <div>
                    <h1>Error: Email not found</h1>
                    <p>We couldn't find an email associated with your registration. Please try registering again.</p>
                </div>
            )}
        </div>
    );
}

export default RegisterSuccess;
