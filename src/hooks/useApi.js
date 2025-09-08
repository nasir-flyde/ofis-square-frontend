import { useMemo, useState } from "react";
import axios from "axios";

// export function useApi(baseUrl = "https://ofis-square-backend.onrender.com") {
export function useApi(baseUrl = "http://localhost:5001") {
  const [token, setToken] = useState(localStorage.getItem("ofis_admin_token") || "");

  const client = useMemo(() => {
    const instance = axios.create({ baseURL: baseUrl });
    
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("ofis_admin_token");
          setToken("");
          // Avoid hard reload loops; send unauthenticated users to /auth
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname || "";
            if (currentPath !== "/auth") {
              window.location.href = "/auth";
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [baseUrl, token]);

  const saveToken = (newToken) => {
    setToken(newToken || "");
    if (newToken) {
      localStorage.setItem("ofis_admin_token", newToken);
    } else {
      localStorage.removeItem("ofis_admin_token");
    }
  };

  return { client, token, saveToken };
}
