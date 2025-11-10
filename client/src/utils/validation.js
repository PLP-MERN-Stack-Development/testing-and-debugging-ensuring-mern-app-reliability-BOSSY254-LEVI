// validation.js - Utility functions for form validation

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateRequired = (value) => {
  return Boolean(value != null && value.toString().trim().length > 0);
};

export const validateMinLength = (value, minLength) => {
  return Boolean(value != null && value.toString().trim().length >= minLength);
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().trim().length <= maxLength;
};

export const validatePost = (post) => {
  const errors = {};

  if (!validateRequired(post.title)) {
    errors.title = 'Title is required';
  } else if (!validateMinLength(post.title, 3)) {
    errors.title = 'Title must be at least 3 characters';
  } else if (!validateMaxLength(post.title, 100)) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (!validateRequired(post.content)) {
    errors.content = 'Content is required';
  } else if (!validateMinLength(post.content, 10)) {
    errors.content = 'Content must be at least 10 characters';
  }

  if (!validateRequired(post.category)) {
    errors.category = 'Category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateUser = (user) => {
  const errors = {};

  if (!validateRequired(user.username)) {
    errors.username = 'Username is required';
  } else if (!validateMinLength(user.username, 3)) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!validateMaxLength(user.username, 30)) {
    errors.username = 'Username must be less than 30 characters';
  }

  if (!validateRequired(user.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(user.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validateRequired(user.password)) {
    errors.password = 'Password is required';
  } else if (!validatePassword(user.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
