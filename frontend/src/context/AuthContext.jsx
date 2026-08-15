import { createContext, useContext, useState } from "react";

import { login as loginApi } from "../api/authApi";
import { decodeToken } from "../utils/decodeToken";
import { AUTH_STATUS } from "../utils/authStatus";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(AUTH_STATUS.UNAUTHENTICATED);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    const response = await loginApi(credentials);

    const data = response.data;

    const token = data?.accessToken || data?.value?.accessToken;

    if (!token) {
      throw new Error("Access token not returned");
    }

    const decodedUser = decodeToken(token);

    setAccessToken(token);
    setUser(decodedUser);
    setStatus(AUTH_STATUS.AUTHENTICATED);

    return {
      data,
      user: decodedUser,
    };
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setStatus(AUTH_STATUS.UNAUTHENTICATED);
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        accessToken,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
