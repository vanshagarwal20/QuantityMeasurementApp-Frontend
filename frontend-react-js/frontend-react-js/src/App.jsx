import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import { getSession, logoutUser } from './auth';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const session = getSession();
    if (session) {
      setAuthState({
        isAuthenticated: true,
        user: session.user,
      });
    }
  }, []);

  const handleLoginSuccess = (session) => {
    setAuthState({
      isAuthenticated: true,
      user: session.user,
    });
  };

  const handleLogout = () => {
    logoutUser();
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authState.isAuthenticated ?
              <Navigate to="/" replace /> :
              <Login onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/register"
          element={
            authState.isAuthenticated ?
              <Navigate to="/" replace /> :
              <Register onRegisterSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/"
          element={
            <Home
              isAuthenticated={authState.isAuthenticated}
              user={authState.user}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;