import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  
  const [currentUser, setCurrentUser] = useState(() => {
    // Get the user state from localStorage (or use a default value)
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : false;
  });

  const [username] = useState(() => {
    // Get the username from localStorage (or use a default value)
    return localStorage.getItem('username') || '';
  });

  const login = () => {
    // Logic to set the user as logged in
    setCurrentUser(true);
  };
 
  const logout = () => {
    // Logic to set the user as logged out
    setCurrentUser(false);
  };

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('username',username);
  },[username]);

  const get_username = localStorage.getItem('username',username)
  return (
    <UserContext.Provider value={{ currentUser, username, get_username, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};