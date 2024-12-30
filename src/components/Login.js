import '../css/Login.css';
import {useEffect,useState} from "react";
import axios from 'axios';
import { useUser } from './UserContext'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
  baseURL: "https://dot-bikerack-backend-1.onrender.com/"
  // baseURL: "http://127.0.0.1:8000"
})

function Login(){
    const query = new URLSearchParams(useLocation().search);
    const uid = query.get('uid');
    const token = query.get('token');
    const [verificationStatus, setVerificationStatus] = useState('');
    const navigate  = useNavigate();
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [wrongpw, setwrongpw] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false);

    const { login } = useUser();
    const { logout } = useUser();

    useEffect(() => {
      const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
      setRememberMe(storedRememberMe);
      console.log('out uid: ',uid)
      console.log('out token: ',token)

      const verifyEmail = async () => {
          if (uid && token) {
            console.log('uid: ',uid)
            console.log('token: ',token)
              try {
                  const response = await axios.get(`https://dot-bikerack-backend-1.onrender.com/verify-email/${uid}/${token}/`);
                  console.log('response!',response)
                  setVerificationStatus('Email verified successfully.');
                  console.log('Verification successful:', response.data.message);
              } catch (error) {
                  setVerificationStatus('Verification failed. Please try again.');
                  console.error('Verification failed:', error);
              }
          }
      };

      verifyEmail();
    }, [uid, token]);
    
    const handleUsernameChange = (event) => {
        setUsername(event.target.value);

    }

    const handlePaswordChange = (event) => {
        setPassword(event.target.value);
    }

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
  }


    const isFormValid = () => {
      return username.trim() !== "" && password.trim() !== "";
    };

    const handleRegisterClick = (e) => {
      e.preventDefault();

      navigate('/register')
    }


    function submitRegistration(e){
      e.preventDefault();
      setLoading(true);
      const csrfToken = getCookie('csrftoken');
      
      client.post(
        'login/',
        {
            credentials: username,
            password: password
        },
        {
            headers: {
                'X-CSRFToken': csrfToken
            }
        }
    )
    .then(function(res) {
        console.log('response', res);
        const accessToken = res.data.access;
        const refreshToken = res.data.refresh;
        
        // Store tokens securely
        // localStorage.setItem('accessToken', accessToken);
        // localStorage.setItem('refreshToken', refreshToken);
        
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
    
        if (username || password) {
            login();
            navigate('/home');

        }
        setLoading(false);
        // Make the request to /user immediately after login
        return client.get('/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    })
    .then(function(userRes) {
        // Handle the response from the /user request
        sessionStorage.setItem('userData', JSON.stringify(userRes.data));
        navigate('/main');
    })
    .catch(function(error) {
        console.error(error);
        if (error.response) {
            console.log(error.response.data);
            logout();
            setwrongpw(true);
        }
    });

        if(rememberMe){
          localStorage.setItem('rememberMe','true');
        }else{
          localStorage.removeItem('rememberMe')
        }

  }

  useEffect(() => {
    toast.info("Logging in might take some time. Please be patient.", {
      autoClose: 5000, 
    });
  }, []);

  return (
      <div id="body" className="d-flex align-items-center py-4 bg-body-tertiary">
        <ToastContainer /> 
        <main className="form-signin w-100 m-auto">
          {verificationStatus && <p>{verificationStatus}</p>}    
          <form onSubmit={(e) => submitRegistration(e)}>
            <h1 className="h3 mb-3 fw-normal">Please sign in</h1>
            {loading && <div className="loading-indicator">Signing in, please wait...</div>}
            <div className="wrongpw">
              {wrongpw ? (
                <div className="error-message" style={{ color: 'red'}}>
                    Wrong credentials. Please try again.
                </div>
              ) : null}
            </div>
            <div className="form-floating">
              <input type="text" className="form-control" id="floatingInput" placeholder="name@example.com" value={username} onChange={handleUsernameChange}/>
              <label htmlFor="floatingInput">Username, Email, or Phone Number</label>
            </div>
            <div className="form-floating">
              <input type="password" className="form-control" id="floatingPassword" placeholder="Password" value={password} onChange={handlePaswordChange}/>
              <label htmlFor="floatingPassword">Password</label>
            </div>
            <div className="form-check text-start my-3">
              <input className="form-check-input" type="checkbox" value="remember-me" id="flexCheckDefault" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}/>
              <label className="form-check-label" htmlFor="flexCheckDefault">
                Remember me
              </label>
            </div>
            <button className="btn btn-primary w-100 py-2" type="submit" disabled={!isFormValid()}>Sign in</button>
          </form>
          <span>Forgot </span>
          <a href="/forgot-credentials" className="forgot-credentials">Credentials</a>
          <span> / </span>
          <a href="/password-reset-request" className="forgot-pwd">Password</a>
          <span>?</span>
          <br />
          <span>Don't have an account?</span>
          <a href="#" className="register-link" onClick={handleRegisterClick}> Register</a>
        </main>
      </div> 
  );
}

export default Login;