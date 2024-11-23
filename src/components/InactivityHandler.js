// InactivityHandler.js
import { useEffect } from "react";

const InactivityHandler = ({ timeout = 300000, onTimeout }) => {
  let timer;

  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (onTimeout) onTimeout();
    }, timeout);
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    // Add event listeners for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);

    // Start the inactivity timer
    resetTimer();

    return () => {
      // Cleanup event listeners and timer
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("click", handleActivity);
      clearTimeout(timer);
    };
  }, []);

  return null; 
};

export default InactivityHandler;
