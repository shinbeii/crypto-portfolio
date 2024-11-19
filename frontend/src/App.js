import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import History from './pages/History';
import Market from './pages/Market';
import Footer from './components/Footer';
import api from './api';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true); // Track initial load state
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (initialLoad) {
            api.verifySession()
                .then(response => {
                    if (response.status === 200) {
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                        navigate("/login");
                    }
                })
                .catch(() => {
                    setIsAuthenticated(false);
                    navigate("/login");
                })
                .finally(() => setInitialLoad(false)); // End initial load state
        }
    }, [initialLoad, navigate]);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        navigate("/dashboard");
    };

    const handleRegisterSuccess = () => {
        setIsAuthenticated(true);
        navigate("/dashboard");
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        api.logout();
        navigate("/login");
    };

    // Show loading message until initial session check is complete
    if (initialLoad) {
        return (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.5rem",
            color: "gray"
          }}>
            Loading...
          </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {isAuthenticated && <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />}
            <main className="flex-grow">
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to={location.pathname} /> : <Login onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register onRegisterSuccess={handleRegisterSuccess} />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
                    <Route path="/history" element={isAuthenticated ? <History /> : <Navigate to="/login" />} />
                    <Route path="/market" element={isAuthenticated ? <Market /> : <Navigate to="/login" />} />

                    {/* Redirect to login by default */}
                    <Route path="/" element={<Navigate to={isAuthenticated ? location.pathname : "/login"} />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;
