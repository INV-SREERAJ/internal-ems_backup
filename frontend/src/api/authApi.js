import api from "./axios";

export const login = (data) => {
    return api.post("/auth/login", data);
};

export const refreshToken = () => {
    return api.post("/auth/refresh");
};

export const logout = () => {
    return api.post("/auth/logout");
};