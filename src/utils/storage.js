// src/utils/storage.js

const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';

// --- User Account Management ---

// Loads all user accounts from local storage
export const loadUsers = () => {
// ^^^ CRITICAL: Must be 'export const'
    try {
        const users = localStorage.getItem(USERS_KEY);
        // Returns the parsed array or an empty array if none exists
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Error loading users:", e);
        return [];
    }
};

// Saves the entire array of user accounts to local storage
export const saveUsers = (users) => {
// ^^^ CRITICAL: Must be 'export const'
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Error saving users:", e);
    }
};


// --- Current Session Management ---

// Loads the currently logged-in user object
export const loadCurrentUser = () => {
// ^^^ CRITICAL: Must be 'export const'
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error loading current user:", e);
        return null;
    }
};

// Saves the current user object to local storage
export const saveCurrentUser = (user) => {
// ^^^ CRITICAL: Must be 'export const'
    try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.error("Error saving current user:", e);
    }
};

// Clears the current user session
export const clearCurrentUser = () => {
// ^^^ CRITICAL: Must be 'export const'
    try {
        localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
        console.error("Error clearing current user:", e);
    }
};