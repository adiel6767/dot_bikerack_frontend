import React, {Suspense} from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import Login  from './components/Login';
// import Register from './components/Register'
// import Home from './components/Home'
import Navbar from "./components/Navbar";
import { UserProvider, useUser } from './components/UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from "./components/Main";
import PasswordResetForm from './components/PasswordResetForm';


const RegisterSuccess = React.lazy(() => import('./components/RegisterSuccess'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Home = React.lazy(() => import('./components/Home'));
const PasswordResetRequest = React.lazy(() => import('./components/PasswordResetRequest'));
const ForgotCredentials = React.lazy(() => import('./components/ForgotCredentials'));
const ForgotPassword = React.lazy(() => import('./components/PasswordResetForm'));
const ResetCredentials  = React.lazy(() => import('./components/ResetCredentials'));
const Data  = React.lazy(() => import('./components/Data'));


// const Navbar = React.lazy(() => import('./components/Navbar'));
// const Main = React.lazy(() => import('./components/Main'));



function App() {
  const ProtectedRoute = ({ element }) => {
    const { currentUser } = useUser();

    return currentUser ? element : <Navigate to="/login" replace />;
  };

  return (
    <UserProvider>
      <div className="App">
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} /> 
            <Route path="/onboarding" element={<RegisterSuccess />}/>
            <Route path="/home" element={<Home />}/>
            <Route path="/login" element={<Login />}/>
            <Route path="/register" element={<Register />}/> 
            <Route path="/main" element={<ProtectedRoute element={<Main/>}/>}/>   
            <Route path="/password-reset-request" element={<PasswordResetRequest/>}/>   
            <Route path="/forgot-credentials" element={<ForgotCredentials/> } />
            <Route path="/forgot-password" element={<ForgotPassword/> }/>
            <Route path="/reset-password" element={<PasswordResetForm/> }/>
            <Route path="/reset-credentials" element={<ResetCredentials/> }/>
            <Route path="/data" element={<ProtectedRoute element={<Data/>}/>}/>
          </Routes>
        </Suspense>
      </BrowserRouter>
      </div>
    </UserProvider>
  );
}

export default App;
