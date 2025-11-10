// api.js - Utility functions for API calls

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData = null;

    if (contentType && contentType.includes('application/json')) {
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use default message
      }
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const getPosts = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `/api/posts${queryParams ? `?${queryParams}` : ''}`;
  return apiRequest(endpoint);
};

export const getPost = (id) => {
  return apiRequest(`/api/posts/${id}`);
};

export const createPost = (postData) => {
  return apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const updatePost = (id, postData) => {
  return apiRequest(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
};

export const deletePost = (id) => {
  return apiRequest(`/api/posts/${id}`, {
    method: 'DELETE',
  });
};

export const login = (credentials) => {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const register = (userData) => {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const getCurrentUser = () => {
  return apiRequest('/api/auth/me');
};

export { ApiError };
