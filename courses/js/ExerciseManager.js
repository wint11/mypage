// ExerciseManager.js
// 练习管理模块

export class ExerciseManager {
    constructor(courseId) {
        this.courseId = courseId;
        this.storageKey = `exercises_${courseId}`;
        this.userChoicesKey = `userChoices_${courseId}`;
        this.exercises = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        this.userChoices = JSON.parse(localStorage.getItem(this.userChoicesKey) || '[]');
        this.currentIndex = this.exercises.length > 0 ? this.exercises.length - 1 : 0;
        this.bufferedExercise = null;
        this.answeredCorrect = false;
        this.isPreloading = false;
    }

    addExercise(exercise) {
        this.exercises.push(exercise);
        this.userChoices.push(null); // 为新题目添加空的用户选择记录
        this.saveExercises();
        this.saveUserChoices();
    }

    saveExercises() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.exercises));
    }

    saveUserChoices() {
        localStorage.setItem(this.userChoicesKey, JSON.stringify(this.userChoices));
    }

    recordUserChoice(exerciseIndex, userChoice) {
        // 只记录第一次选择
        if (this.userChoices[exerciseIndex] === null || this.userChoices[exerciseIndex] === undefined) {
            this.userChoices[exerciseIndex] = userChoice;
            this.saveUserChoices();
        }
    }

    getUserChoice(exerciseIndex) {
        return this.userChoices[exerciseIndex];
    }

    clearBufferedExercise() {
        this.bufferedExercise = null;
    }

    initializeExercises(initialExercise) {
        if (this.exercises.length === 0 && initialExercise) {
            this.exercises.push(initialExercise);
            this.saveExercises();
        }
    }

    resetState() {
        this.exercises = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        this.userChoices = JSON.parse(localStorage.getItem(this.userChoicesKey) || '[]');
        this.currentIndex = this.exercises.length > 0 ? this.exercises.length - 1 : 0;
        this.bufferedExercise = null;
        this.answeredCorrect = false;
        this.isPreloading = false;
    }

    setBufferedExercise(exercise) {
        this.bufferedExercise = exercise;
    }

    setIsPreloading(status) {
        this.isPreloading = status;
    }

    getBufferedExercise() {
        return this.bufferedExercise;
    }

    getIsPreloading() {
        return this.isPreloading;
    }
}

// 兼容旧版本的全局变量和函数（保持向后兼容）
let exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
let currentIndex = exercises.length > 0 ? exercises.length - 1 : 0;
let bufferedExercise = null;
let answeredCorrect = false;
let isPreloading = false;

export { exercises, currentIndex, bufferedExercise, answeredCorrect, isPreloading };

export function getExercises() {
    return exercises;
}

export function getCurrentIndex() {
    return currentIndex;
}

export function setCurrentIndex(index) {
    currentIndex = index;
}

export function getBufferedExercise() {
    return bufferedExercise;
}

export function setBufferedExercise(exercise) {
    bufferedExercise = exercise;
}

export function getAnsweredCorrect() {
    return answeredCorrect;
}

export function setAnsweredCorrect(status) {
    answeredCorrect = status;
}

export function getIsPreloading() {
    return isPreloading;
}

export function setIsPreloading(status) {
    isPreloading = status;
}

export function addExercise(exercise) {
    exercises.push(exercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
}

export function incrementCurrentIndex() {
    currentIndex++;
}

export function saveExercises() {
    localStorage.setItem('exercises', JSON.stringify(exercises));
}

export function clearBufferedExercise() {
    bufferedExercise = null;
}

export function initializeExercises(initialExercise) {
    if (exercises.length === 0 && initialExercise) {
        exercises.push(initialExercise);
        localStorage.setItem('exercises', JSON.stringify(exercises));
    }
}

export function resetState() {
    exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    currentIndex = exercises.length > 0 ? exercises.length - 1 : 0;
    bufferedExercise = null;
    answeredCorrect = false;
    isPreloading = false;
}