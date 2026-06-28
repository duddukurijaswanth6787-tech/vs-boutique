import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE_URL = 'http://10.10.1.25:3005';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!storedUser || !token) {
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(storedUser);
            // Set cached user immediately so UI doesn't flash
            setUser(parsedUser);

            // If owner — always re-fetch fresh permissions from DB
            // This ensures admin permission changes take effect immediately
            if (parsedUser.role === 'owner') {
                try {
                    const response = await axios.get(`${API_BASE_URL}/owner/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const freshOwner = response.data;

                    // Merge fresh permissions + status into stored user
                    const updatedUser = {
                        ...parsedUser,
                        permissions: freshOwner.permissions,
                        status: freshOwner.status,
                    };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (err) {
                    // If fetch fails (e.g. blocked/inactive), log out the owner
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        setUser(null);
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                    }
                    // On network error, keep cached user — don't break the session
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // Expose refreshUser so any component can force a permission re-sync
    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        try {
            const endpoint = user.role === 'owner' ? '/owner/me' : null;
            if (!endpoint) return;
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fresh = response.data;
            const updatedUser = { ...user, permissions: fresh.permissions, status: fresh.status };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('Failed to refresh user:', err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
