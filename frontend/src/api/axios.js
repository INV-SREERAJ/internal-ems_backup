import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let getAccessToken = () => null;
let handleLogout = () => {};
let handleRefreshSuccess = () => {};

export const setAuthCallbacks = ({ getAccessToken: getTk, onLogout, onRefreshSuccess }) => {
    if (getTk) getAccessToken = getTk;
    if (onLogout) handleLogout = onLogout;
    if (onRefreshSuccess) handleRefreshSuccess = onRefreshSuccess;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        const isAuthEndpoint =
            config.url?.includes("/auth/login") ||
            config.url?.includes("/auth/refresh");

        if (token && !isAuthEndpoint) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response || error.response.status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        const isAuthEndpoint =
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/refresh");

        if (isAuthEndpoint || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshUrl = `${import.meta.env.VITE_API_URL || ""}/auth/refresh`;
            const response = await axios.post(
                refreshUrl,
                {},
                { withCredentials: true }
            );

            const newAccessToken = response.data?.accessToken;
            if (!newAccessToken) {
                throw new Error("No access token returned on refresh");
            }

            handleRefreshSuccess(newAccessToken, response.data);
            processQueue(null, newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            handleLogout();
            alert("Your session has expired. Please log in again.");
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;