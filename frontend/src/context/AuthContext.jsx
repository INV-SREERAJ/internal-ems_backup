import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshApi,
} from "../api/authApi";
import { setAuthCallbacks } from "../api/axios";
import { decodeToken } from "../utils/decodeToken";
import { AUTH_STATUS } from "../utils/authStatus";

export const AuthContext = createContext(null);

const initialState = {
  status: AUTH_STATUS.INITIALIZING,
  accessToken: null,
  user: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        status: action.payload.status,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
      };

    case "LOGIN":
      return {
        ...state,
        status: AUTH_STATUS.AUTHENTICATED,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
      };

    case "LOGOUT":
      return {
        ...state,
        status: AUTH_STATUS.UNAUTHENTICATED,
        accessToken: null,
        user: null,
      };

    case "SET_ACCESS_TOKEN":
      return {
        ...state,
        accessToken: action.payload,
      };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const initialize = useCallback((status, accessToken = null, user = null) => {
    dispatch({
      type: "INITIALIZE",
      payload: {
        status,
        accessToken,
        user,
      },
    });
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await loginApi(credentials);
    const data = response?.data || response;
    const accessToken = data?.accessToken || data?.value?.accessToken;
    const mustChangePassword =
      data?.mustChangePassword ?? data?.value?.mustChangePassword ?? false;

    const decodedUser = decodeToken(accessToken);
    const user = {
      ...decodedUser,
      mustChangePassword,
    };

    dispatch({
      type: "LOGIN",
      payload: {
        accessToken,
        user,
      },
    });

    return { data, user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore error if network fails or session already expired
    } finally {
      dispatch({
        type: "LOGOUT",
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await refreshApi();
      const data = response?.data || response;
      const accessToken = data?.accessToken || data?.value?.accessToken;
      const mustChangePassword =
        data?.mustChangePassword ?? data?.value?.mustChangePassword ?? false;

      if (!accessToken) {
        initialize(AUTH_STATUS.UNAUTHENTICATED, null, null);
        return false;
      }

      const decodedUser = decodeToken(accessToken);
      if (!decodedUser) {
        initialize(AUTH_STATUS.UNAUTHENTICATED, null, null);
        return false;
      }

      const user = {
        ...decodedUser,
        mustChangePassword,
      };

      initialize(AUTH_STATUS.AUTHENTICATED, accessToken, user);

      return true;
    } catch {
      initialize(AUTH_STATUS.UNAUTHENTICATED, null, null);

      return false;
    }
  }, [initialize]);

  const setAccessToken = useCallback((token) => {
    dispatch({
      type: "SET_ACCESS_TOKEN",
      payload: token,
    });
  }, []);

  const setUser = useCallback((user) => {
    dispatch({
      type: "SET_USER",
      payload: user,
    });
  }, []);

  useEffect(() => {
    setAuthCallbacks({
      getAccessToken: () => stateRef.current.accessToken,
      onLogout: () => {
        dispatch({ type: "LOGOUT" });
      },
      onRefreshSuccess: (newToken, responseData) => {
        const decodedUser = decodeToken(newToken);
        const user = {
          ...decodedUser,
          mustChangePassword: responseData?.mustChangePassword ?? false,
        };
        dispatch({
          type: "LOGIN",
          payload: {
            accessToken: newToken,
            user,
          },
        });
      },
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        status: state.status,
        accessToken: state.accessToken,
        user: state.user,

        login,
        logout,
        refresh,
        initialize,
        setAccessToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
