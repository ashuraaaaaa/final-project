// src/utils/storage.js

export const LS_USERS_KEY = 'quiz_app_users';
export const LS_CURRENT_USER_KEY = 'quiz_app_current_user';
export const LS_QUIZ_RESULTS_KEY = 'quiz_results'; // Added for future use

export const loadUsers = () => {
  try {
    const users = localStorage.getItem(LS_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("Error loading users from local storage:", error);
    return [];
  }
};

export const saveUsers = (users) => {
  try {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users to local storage:", error);
  }
};

export const saveCurrentUser = (user) => {
  try {
    localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving current user to local storage:", error);
  }
};

export const loadCurrentUser = () => {
  try {
    const user = localStorage.getItem(LS_CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error loading current user from local storage:", error);
    return null;
  }
};

export const clearCurrentUser = () => {
  try {
    localStorage.removeItem(LS_CURRENT_USER_KEY);
  } catch (error) {
    console.error("Error clearing current user from local storage:", error);
  }
};