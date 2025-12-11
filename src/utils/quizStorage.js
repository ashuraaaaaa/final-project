// src/utils/quizStorage.js

const QUIZZES_KEY = 'app_quizzes';

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
    return quizzes.find(q => q.id === quizId);
};