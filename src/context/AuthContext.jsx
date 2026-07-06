import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { data } = response.data;

        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Clear local state even if the logout request fails.
        } finally {
            setUser(null);
        }
    };

    const updateUser = (updatedUser) => {
        setUser((currentUser) => ({ ...currentUser, ...updatedUser }));
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
