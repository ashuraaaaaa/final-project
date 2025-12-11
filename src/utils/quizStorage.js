// src/utils/quizStorage.js

const QUIZZES_KEY = 'app_quizzes';

// --- Quiz Management (Instructor Side) ---

// Loads all quizzes created by the instructor
export const loadQuizzes = () => {
    try {
        const quizzes = localStorage.getItem(QUIZZES_KEY);
        return quizzes ? JSON.parse(quizzes) : [];
    } catch (e) {
        console.error("Error loading quizzes:", e);
        return [];
    }
};

// Saves the entire list of quizzes
export const saveQuizzes = (quizzes) => {
    try {
        localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
    } catch (e) {
        console.error("Error saving quizzes:", e);
    }
};

// Adds a new quiz to the list and saves
export const addQuiz = (newQuiz) => {
    const quizzes = loadQuizzes();
    quizzes.push(newQuiz);
    saveQuizzes(quizzes);
};

// Finds a specific quiz by ID
export const findQuizById = (quizId) => {
    const quizzes = loadQuizzes();
    // Search by ID, converting both to string for reliable matching
    return quizzes.find(q => q.id.toString() === quizId.toString()); 
};

// Generates a simple 6-digit number ID for the instructor to share
export const generateQuizId = () => {
    // Generate a number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000);
};

// Deletes a quiz by ID
export const deleteQuiz = (quizId) => {
    const quizzes = loadQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.id.toString() !== quizId.toString());
    saveQuizzes(updatedQuizzes);
};

// --- Student Access Management (User Isolated) ---

// Adds a quiz ID to a SPECIFIC user's list of joined quizzes
export const joinQuiz = (quizId, userId) => {
    if (!userId) {
        console.error("Cannot join quiz: Missing User ID");
        return;
    }
    
    const joined = loadJoinedQuizzes(userId);
    
    // Check if already joined (convert to string to ensure matching works)
    if (!joined.map(String).includes(quizId.toString())) {
        joined.push(quizId);
        // Save to a key unique to this user (e.g., app_joined_quizzes_12345)
        localStorage.setItem(`app_joined_quizzes_${userId}`, JSON.stringify(joined));
    }
};

// Loads the list of quiz IDs for a SPECIFIC user
export const loadJoinedQuizzes = (userId) => {
    if (!userId) return [];

    try {
        const joined = localStorage.getItem(`app_joined_quizzes_${userId}`);
        return joined ? JSON.parse(joined) : [];
    } catch (e) {
        console.error("Error loading joined quizzes:", e);
        return [];
    }
};