import React, { Suspense,useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { UserProvider, useUser } from './components/UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from "./components/Main";
import PasswordResetForm from './components/PasswordResetForm';
import InactivityHandler from "./components/InactivityHandler";

const RegisterSuccess = React.lazy(() => import('./components/RegisterSuccess'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Home = React.lazy(() => import('./components/Home'));
const PasswordResetRequest = React.lazy(() => import('./components/PasswordResetRequest'));
const ForgotCredentials = React.lazy(() => import('./components/ForgotCredentials'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword')); // Fixed import
const ResetCredentials = React.lazy(() => import('./components/ResetCredentials'));
const Data = React.lazy(() => import('./components/Data'));

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("currentUser");
    return storedUser ? JSON.parse(storedUser) : false;
  });


  const ProtectedRoute = ({ element }) => {
    const { currentUser } = useUser();

    return currentUser ? element : <Navigate to="/login" replace />;
  };


const handleTimeout = () => {
  localStorage.clear();
  window.location.reload();
  alert("You have been logged out due to inactivity.");
  setCurrentUser(false);

};
  return (
    <UserProvider>
      {currentUser  && <InactivityHandler timeout={5000} onTimeout={handleTimeout} />}
      <div className="App">
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/onboarding" element={<RegisterSuccess />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/main" element={<ProtectedRoute element={<Main />} />} />
            <Route path="/password-reset-request" element={<PasswordResetRequest />} />
            <Route path="/forgot-credentials" element={<ForgotCredentials />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<PasswordResetForm />} />
            <Route path="/reset-credentials" element={<ResetCredentials />} />
            <Route path="/data" element={<ProtectedRoute element={<Data />} />} />
          </Routes>
        </Suspense>
      </div>
    </UserProvider>
  );
}

export default App;
