import axios from 'axios';
// import { getToken } from './auth_helper';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token in the headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const GET = async (url, params = {}) => {
    try {
        const response = await apiClient.get(url, { params });
        return response.data;
    } catch (error) {
        console.error('GET request failed:', error);
        throw error;
    }
}
export const POST = async (url, data = {}) => {
    try {
        const response = await apiClient.post(url, data);
        return response.data;
    } catch (error) {
        console.error('POST request failed:', error);
        throw error;
    }
}
export const PUT = async (url, data = {}) => {
    try {
        const response = await apiClient.put(url, data);
        return response.data;
    } catch (error) {
        console.error('PUT request failed:', error);
        throw error;
    }
}
export const DELETE = async (url) => {
    try {
        const response = await apiClient.delete(url);
        return response.data;
    } catch (error) {
        console.error('DELETE request failed:', error);
        throw error;
    }
}
