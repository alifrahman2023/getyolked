import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5001/",
  withCredentials: true, // Ensures cookies (if needed)
});

// Function to get tokens
const getTokens = () => ({
  access: localStorage.getItem("access_token"),
  //refresh: localStorage.getItem("refresh_token"),
});

// Function to store tokens
const storeTokens = (access, refresh) => {
  if (access) localStorage.setItem("access_token", access);
  //if (refresh) localStorage.setItem("refresh_token", refresh);
};

// **Request Interceptor** (Attach tokens to requests)
api.interceptors.request.use(
  (config) => {
    const { access } = getTokens();
    if (!access) {
      window.location.href = "/login"; // Redirect if no token
      return Promise.reject("No access token, redirecting to login...");
    }
    // Set the header with the "Bearer " prefix as expected by Flask-JWT-Extended
    config.headers.Authorization = `Bearer ${access}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// **Response Interceptor** (Extract & Store Tokens Automatically)
api.interceptors.response.use(
  (response) => {
    // Extract tokens from response if provided (tokens are expected in keys "access_token" and "refresh_token")
    const { access_token, refresh_token } = response.data;
    if (access_token || refresh_token) {
      storeTokens(access_token, refresh_token);
    }
    return response;
  },
  /*async (error) => {
    console.log("Errorr: ",error)
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refresh } = getTokens();

      if (!refresh) {
        //localStorage.clear();
        //window.location.href = "/login"; // Redirect if refresh token is missing
        return Promise.reject("No refresh token, logging out...");
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/refresh`,
          { refresh }
        );
        // Store the new tokens
        storeTokens(data.access_token, data.refresh_token);
        // Set the Authorization header correctly with "Bearer " prefix
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        console.log
        //localStorage.clear();
        //window.location.href = "/login"; // Redirect if refresh fails
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }*/
);

export default api;
