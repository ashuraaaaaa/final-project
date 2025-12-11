// src/utils/storage.js

const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';

// --- User Account Management ---

/**
 * Loads all user accounts (students and instructors) from Local Storage.
 * @returns {Array} An array of user objects, or an empty array if none exist.
 */
export const loadUsers = () => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Error loading users:", e);
        return [];
    }
};

/**
 * Saves the entire array of user accounts to Local Storage.
 * @param {Array} users - The array of user objects to save.
 */
export const saveUsers = (users) => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Error saving users:", e);
    }
};


// --- Current Session Management ---

/**
 * Loads the currently logged-in user object from Local Storage.
 * @returns {Object|null} The current user object or null if no user is logged in.
 */
export const loadCurrentUser = () => {
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error loading current user:", e);
        return null;
    }
};

/**
 * Saves the current user object to Local Storage (logs a user in).
 * @param {Object} user - The user object to save.
 */
export const saveCurrentUser = (user) => {
    try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.error("Error saving current user:", e);
    }
};

/**
 * Clears the current user session from Local Storage (logs a user out).
 */
export const clearCurrentUser = () => {
    try {
        localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
        console.error("Error clearing current user:", e);
    }
};