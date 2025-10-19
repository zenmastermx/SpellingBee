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
        PERFECT_SPELLER: { name: "Perfect Speller", description: "Get 10 correct answers in a row", icon: "🎯", unlocked: false },
        WEEK_WARRIOR: { name: "Week Warrior", description: "Maintain a 7-day study streak", icon: "⚔️", unlocked: false },
        SPEED_DEMON: { name: "Speed Demon", description: "Answer a word correctly in under 5 seconds", icon: "⚡", unlocked: false },
        COMEBACK_KID: { name: "Comeback Kid", description: "Get a word right after getting it wrong", icon: "💪", unlocked: false },
        WORD_SMITH: { name: "Word Smith", description: "Add your first custom word", icon: "📝", unlocked: false },
        MASTER_MIND: { name: "Master Mind", description: "Master your first word (interval > 21 days)", icon: "🧠", unlocked: false },
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
            this.celebrateLevelUp();
        }
        this.save();
    },

    celebrateLevelUp() {
        // Confetti explosion
        if (typeof confetti !== 'undefined') {
            confetti.levelUpExplosion();
        }

        // Screen shake effect
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.classList.add('screen-shake');
            setTimeout(() => appContainer.classList.remove('screen-shake'), 500);
        }

        // Level display pulse
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.classList.add('level-pulse');
            setTimeout(() => levelDisplay.classList.remove('level-pulse'), 600);
        }

        // Show level-up modal
        this.showLevelUpModal();

        // Play sound
        if (typeof SoundManager !== 'undefined') {
            SoundManager.playLevelUp();
        }
    },

    showLevelUpModal() {
        const modal = document.createElement('div');
        modal.className = 'level-up-modal';
        modal.innerHTML = `
            <div class="level-up-content">
                <h2>🎉 LEVEL UP! 🎉</h2>
                <p>You're now Level ${this.level}!</p>
                <button class="btn btn-primary" onclick="this.closest('.level-up-modal').remove()">Awesome!</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Auto-remove after 4 seconds if user doesn't click
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 4000);
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
        const wasIncremented = lastDate === yesterday;

        if (wasIncremented) {
            this.streak.current++;
        } else {
            this.streak.current = 1;
        }

        if (this.streak.current > this.streak.longest) {
            this.streak.longest = this.streak.current;
        }
        this.streak.lastDate = today;

        // Trigger streak animations
        if (wasIncremented) {
            this.celebrateStreak();
        }

        if (this.streak.current >= 7) {
            this.unlockAchievement('WEEK_WARRIOR');
        }
        this.save();
    },

    celebrateStreak() {
        // Dispatch custom event for streak update
        window.dispatchEvent(new CustomEvent('streakUpdate', {
            detail: { streak: this.streak.current }
        }));

        // Play streak sound at milestones
        if (this.streak.current % 7 === 0 && typeof SoundManager !== 'undefined') {
            SoundManager.playStreak();
        }

        // Confetti at streak milestones
        if (typeof confetti !== 'undefined') {
            if (this.streak.current === 7 || this.streak.current === 14 ||
                this.streak.current === 21 || this.streak.current === 30) {
                confetti.streakBurst(window.innerWidth / 2, 100, this.streak.current);
            }
        }
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
