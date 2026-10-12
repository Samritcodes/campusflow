import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function getHomePathForRole(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
    case 'DEPARTMENT_MANAGER':
      return '/organizer';
    case 'STUDENT':
    default:
      return '/student';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [myPasses, setMyPasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await apiRequest('/auth/me.php');
      setUser(res.data?.user || null);
      setStats(res.data?.stats || null);
      setMyPasses(res.data?.my_passes || []);
      setAnnouncements(res.data?.announcements || []);
      return res.data?.user || null;
    } catch {
      setUser(null);
      setStats(null);
      setMyPasses([]);
      setAnnouncements([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login.php', {
      method: 'POST',
      body: { email, password },
    });
    await refreshSession();
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await apiRequest('/auth/register.php', {
      method: 'POST',
      body: payload,
    });
    await refreshSession();
    return res.data.user;
  };

  const logout = async () => {
    await apiRequest('/auth/logout.php', { method: 'POST' });
    setUser(null);
    setStats(null);
    setMyPasses([]);
    setAnnouncements([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        myPasses,
        announcements,
        loading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
