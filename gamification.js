const Gamification = {
    POINTS_CONFIG: {
        CORRECT_EASY: 10,
        CORRECT_GOOD: 20,
        CORRECT_HARD: 30,
        STREAK_BONUS: 50,
        DAILY_GOAL_BONUS: 100,
    },

    LEVEL_XP: 500, // XP needed to level up

    ACHIEVEMENTS: {
        PERFECT_SPELLER: { name: "Perfect Speller", description: "Get 10 correct answers in a row", unlocked: false },
        WEEK_WARRIOR: { name: "Week Warrior", description: "Maintain a 7-day study streak", unlocked: false },
        SPEED_DEMON: { name: "Speed Demon", description: "Answer a word correctly in under 5 seconds", unlocked: false },
        COMEBACK_KID: { name: "Comeback Kid", description: "Get a word right after getting it wrong", unlocked: false },
        WORD_SMITH: { name: "Word Smith", description: "Add your first custom word", unlocked: false },
        MASTER_MIND: { name: "Master Mind", description: "Master your first word (interval > 21 days)", unlocked: false },
    },

    init() {
        this.points = Storage.get('gamification_points', 0);
        this.level = Storage.get('gamification_level', 1);
        this.achievements = Storage.get('gamification_achievements', this.ACHIEVEMENTS);
        this.streak = Storage.get('gamification_streak', { current: 0, longest: 0, lastDate: null });
        this.ensureTodayStats();
    },

    ensureTodayStats() {
        const today = this.getTodayDateString();
        if (this.currentDate !== today || !this.todayStats) {
            this.currentDate = today;
            this.todayStats = Storage.get(`gamification_stats_${this.currentDate}`, { correct: 0, incorrect: 0 }) || { correct: 0, incorrect: 0 };
        }
    },

    addPoints(amount) {
        this.points += amount;
        const xpForCurrentLevel = this.points - ((this.level - 1) * this.LEVEL_XP);
        if (xpForCurrentLevel >= this.LEVEL_XP) {
            this.level++;
            // Add level up fanfare
        }
        this.save();
    },

    processAnswer(correct, quality, timeTaken, word) {
        this.ensureTodayStats();
        this.updateTodayStats(correct);
        if (correct) {
            let points = 0;
            if (quality >= 5) points = this.POINTS_CONFIG.CORRECT_EASY;
            else if (quality >= 3) points = this.POINTS_CONFIG.CORRECT_GOOD;
            else points = this.POINTS_CONFIG.CORRECT_HARD;
            this.addPoints(points);

            if (timeTaken < 5000) {
                this.unlockAchievement('SPEED_DEMON');
            }
            if (word.history.length > 0 && word.history[word.history.length - 1].correct === false) {
                this.unlockAchievement('COMEBACK_KID');
            }
        } 
    },

    updateTodayStats(correct) {
        if (correct) {
            this.todayStats.correct++;
        } else {
            this.todayStats.incorrect++;
        }
        Storage.set(`gamification_stats_${this.getTodayDateString()}`, this.todayStats);
    },

    getTodayAccuracy() {
        this.ensureTodayStats();
        const total = this.todayStats.correct + this.todayStats.incorrect;
        if (total === 0) return 0;
        return Math.round((this.todayStats.correct / total) * 100);
    },

    updateStreak() {
        const today = this.getTodayDateString();
        const lastDate = this.streak.lastDate;

        if (lastDate === today) return; // Already studied today

        const yesterday = this.getYesterdayDateString();
        if (lastDate === yesterday) {
            this.streak.current++;
        } else {
            this.streak.current = 1;
        }

        if (this.streak.current > this.streak.longest) {
            this.streak.longest = this.streak.current;
        }
        this.streak.lastDate = today;

        if (this.streak.current >= 7) {
            this.unlockAchievement('WEEK_WARRIOR');
        }
        this.save();
    },

    unlockAchievement(key) {
        if (!this.achievements[key].unlocked) {
            this.achievements[key].unlocked = true;
            // Trigger a notification/celebration
            this.save();
            return true; // Indicates a new achievement was unlocked
        }
        return false;
    },

    save() {
        Storage.set('gamification_points', this.points);
        Storage.set('gamification_level', this.level);
        Storage.set('gamification_achievements', this.achievements);
        Storage.set('gamification_streak', this.streak);
    },

    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    },

    getYesterdayDateString() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }
};
