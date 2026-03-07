// AuthContext.jsx
// Manages Google OAuth2 login state by checking /api/auth/me on load.
// Exposes: user, loading, login(), logout()

import { createContext, useContext, useState, useEffect } from "react";

const BACKEND_URL = ""; // Relative URL — Nginx proxies /api/* and /oauth2/* to Spring Boot backend

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount: check if user is already logged in
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/auth/me`, {
            credentials: "include",  // send session cookie
        })
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((data) => setUser(data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    // Redirect to Google OAuth2 login
    const login = () => {
        window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
    };

    // Call Spring Security logout endpoint, then clear local state
    const logout = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (_) { }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
