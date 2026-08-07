import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Check for existing session
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Auth initialization failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const res = await apiClient.post('/auth/login', { email, password });
            const { token, user: userData } = res.data;

            if (token) {
                localStorage.setItem('token', token); // Stored as plain string
                localStorage.setItem('hms_token', token); // For apiClient compatibility
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                return userData;
            }
        } catch (err) {
            console.error("Login failed", err);
            throw err.response?.data?.error || 'Login failed. Please check your network.';
        }
    };

    /**
     * Hospital Demo Mode - Bypass Login
     * Rapidly authenticates based on role for testing.
     */
    const hospitalDevLogin = async (role) => {
        try {
            console.log(`[AUTH_DEBUG] Attempting Role Bypass: ${role}`);
            const res = await apiClient.post('/auth/dev-login', { role });
            const { token, user: userData } = res.data;

            if (token) {
                console.log(`[AUTH_DEBUG] Bypass Success for ${userData.email}`);
                localStorage.setItem('token', token);
                localStorage.setItem('hms_token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                return userData;
            }
        } catch (err) {
            console.error("[AUTH_DEBUG] Dev Login failed", err);
            const errorMsg = err.response?.data?.error || 'Bypass login failed: Network or Config error.';
            throw errorMsg;
        }
    };

    const mockLogin = (roleData) => {
        const mockUserData = {
            id: 'dev-user',
            email: roleData.email,
            role: roleData.role,
            first_name: 'Dev',
            last_name: roleData.title
        };
        const mockToken = 'dev-token-bypass-' + Date.now();

        localStorage.setItem('token', mockToken);
        localStorage.setItem('hms_token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUserData));
        setUser(mockUserData);
        return mockUserData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('hms_token');
        localStorage.removeItem('user');
        setUser(null);
        // Optional: Redirect to login or specialized logout page
    };

    const value = {
        user,
        login,
        mockLogin,
        hospitalDevLogin,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
