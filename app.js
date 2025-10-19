document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {
            words: [],
            settings: {},
            practiceSession: {
                masterQueue: [],
                activeQueue: [],
                relearningQueue: [],
                currentWord: null,
                startTime: null,
                correctStreak: 0,
                lastAnswerCorrect: null,
            },
            voices: [],
            editingWordId: null,
        },

        init() {
            if (!('speechSynthesis' in window)) {
                alert("Sorry, your browser doesn't support text-to-speech. The core feature of this app will not work.");
                document.getElementById('play-word-btn').disabled = true;
            }

            this.loadData();
            this.setupEventListeners();
            this.populateVoices();
            this.applySettings();
            this.render();
            Gamification.init();
            this.updateDashboard();
        },

        loadData() {
            this.state.words = Storage.get('words', this.getSampleWords());
            this.state.settings = Storage.get('settings', {
                speechRate: 1.0,
                voice: null,
                dailyGoal: 20,
                sound: true,
                theme: 'light',
            });
        },

        getSampleWords() {
            const sampleWords = ['accommodate', 'rhythm', 'conscience', 'embarrass', 'millennium', 'bureaucracy', 'surveillance', 'liaison', 'questionnaire', 'onomatopoeia', 'idiosyncrasy', 'phenomenon', 'ubiquitous', 'xylophone', 'zealous', 'yacht', 'unnecessary', 'succeed', 'privilege', 'occurrence'];
            return sampleWords.map(word => SM2.createWord(word));
        },

        setupEventListeners() {
            // Navigation
            document.querySelector('.bottom-nav').addEventListener('click', e => {
                if (e.target.closest('.nav-btn')) {
                    const viewName = e.target.closest('.nav-btn').dataset.view;
                    this.navigateTo(viewName);
                }
            });

            // Dashboard
            document.getElementById('start-practice-btn').addEventListener('click', () => this.startPractice());

            // Practice
            document.getElementById('play-word-btn').addEventListener('click', () => this.speakWord());
            document.getElementById('submit-spell-btn').addEventListener('click', () => this.checkSpelling());
            document.getElementById('spell-input').addEventListener('keyup', e => {
                if (e.key === 'Enter') this.checkSpelling();
            });
            document.querySelector('.rating-buttons').addEventListener('click', e => {
                if (e.target.classList.contains('btn-rating')) {
                    const quality = parseInt(e.target.dataset.quality, 10);
                    this.rateWord(quality);
                }
            });

            // Word List
            document.getElementById('add-word-btn').addEventListener('click', () => this.showWordModal());
            document.getElementById('import-words-btn').addEventListener('click', () => this.showImportModal());
            document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
            document.getElementById('delete-all-words-btn').addEventListener('click', () => this.deleteAllWords());
            document.getElementById('word-list-container').addEventListener('click', e => {
                if (e.target.closest('.edit-word-btn')) {
                    const wordId = e.target.closest('.edit-word-btn').dataset.id;
                    this.showWordModal(wordId);
                }
                if (e.target.closest('.delete-word-btn')) {
                    const wordId = e.target.closest('.delete-word-btn').dataset.id;
                    this.deleteWord(wordId);
                }
            });

            // Modals
            document.querySelectorAll('.modal .close-btn').forEach(btn => btn.addEventListener('click', () => this.closeModals()));
            document.getElementById('save-word-btn').addEventListener('click', () => this.saveWord());
            document.getElementById('save-import-btn').addEventListener('click', () => this.importWords());
            document.getElementById('import-file-input').addEventListener('change', e => this.importFromFile(e));

            // Settings
            document.getElementById('theme-toggle').addEventListener('change', e => this.toggleTheme(e.target.checked));
            document.getElementById('speech-rate-slider').addEventListener('input', e => {
                this.state.settings.speechRate = parseFloat(e.target.value);
                document.getElementById('speech-rate-value').textContent = e.target.value;
                this.saveSettings();
            });
            document.getElementById('voice-select').addEventListener('change', e => {
                this.state.settings.voice = e.target.value;
                this.saveSettings();
            });
            document.getElementById('daily-goal-input').addEventListener('change', e => {
                this.state.settings.dailyGoal = parseInt(e.target.value, 10);
                this.saveSettings();
                this.updateDashboard();
            });
            document.getElementById('sound-toggle').addEventListener('change', e => {
                this.state.settings.sound = e.target.checked;
                this.saveSettings();
            });
            document.getElementById('reset-progress-btn').addEventListener('click', () => this.resetProgress());

            // Speech Synthesis
            if ('speechSynthesis' in window) {
                speechSynthesis.onvoiceschanged = () => this.populateVoices();
            }
        },

        applySettings() {
            // Theme
            document.documentElement.dataset.theme = this.state.settings.theme;
            document.getElementById('theme-toggle').checked = this.state.settings.theme === 'dark';
            // Speech Rate
            document.getElementById('speech-rate-slider').value = this.state.settings.speechRate;
            document.getElementById('speech-rate-value').textContent = this.state.settings.speechRate;
            // Daily Goal
            document.getElementById('daily-goal-input').value = this.state.settings.dailyGoal;
            // Sound
            document.getElementById('sound-toggle').checked = this.state.settings.sound;
        },

        render() {
            this.renderWordList();
            this.renderAchievements();
            this.renderCalendarHeatmap();
        },

        navigateTo(viewId) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add('active');
        },

        updateDashboard() {
            document.getElementById('level-display').textContent = `Level ${Gamification.level}`;
            document.getElementById('points-display').textContent = `${Gamification.points} Points`;
            const xpForLevel = (Gamification.level - 1) * Gamification.LEVEL_XP;
            const currentXp = Gamification.points - xpForLevel;
            document.getElementById('xp-bar').value = currentXp;
            document.getElementById('xp-bar').max = Gamification.LEVEL_XP;
            document.getElementById('streak-display').textContent = `🔥 ${Gamification.streak.current}`;
            
            const mastered = this.state.words.filter(w => w.interval > 21).length;
            document.getElementById('mastered-words-count').textContent = mastered;
            document.getElementById('today-accuracy').textContent = `${Gamification.getTodayAccuracy()}%`;
            document.getElementById('longest-streak-count').textContent = `${Gamification.streak.longest} days`;

            const dailyGoal = this.state.settings.dailyGoal;
            const completedToday = 0; // This needs to be calculated from word history
            document.getElementById('daily-goal-count').textContent = dailyGoal;
            document.getElementById('completed-today-count').textContent = completedToday;
            document.getElementById('daily-goal-progress').value = completedToday;
            document.getElementById('daily-goal-progress').max = dailyGoal;
        },

        startPractice() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const dueWords = this.state.words
                .filter(word => new Date(word.nextReview) <= today)
                .sort((a, b) => a.repetitions - b.repetitions || a.easeFactor - b.easeFactor);

            if (dueWords.length === 0) {
                alert("No words due for review today!");
                return;
            }

            this.state.practiceSession.masterQueue = dueWords;
            this.state.practiceSession.relearningQueue = [];
            this.state.practiceSession.correctStreak = 0;

            const dailyGoal = this.state.settings.dailyGoal || 20;
            this.state.practiceSession.activeQueue = this.state.practiceSession.masterQueue.splice(0, dailyGoal);
            
            this.nextWord();
            this.navigateTo('practice-view');
        },

        nextWord() {
            let nextWord = null;
            // Prioritize words in the relearning queue
            if (this.state.practiceSession.relearningQueue.length > 0) {
                nextWord = this.state.practiceSession.relearningQueue.shift();
            } else if (this.state.practiceSession.activeQueue.length > 0) {
                // Then take from the active queue, shuffling to keep it random
                const randomIndex = Math.floor(Math.random() * this.state.practiceSession.activeQueue.length);
                nextWord = this.state.practiceSession.activeQueue.splice(randomIndex, 1)[0];
            }

            const session = this.state.practiceSession;
            if (nextWord) {
                session.currentWord = nextWord;
                session.startTime = Date.now();
                document.getElementById('spell-input').value = '';
                document.getElementById('spell-input').disabled = false;
                document.getElementById('feedback-container').style.display = 'none';
                const remaining = session.relearningQueue.length + session.activeQueue.length + (session.currentWord ? 1 : 0);
                document.getElementById('words-remaining-count').textContent = remaining;
                this.speakWord();
            } else {
                alert("Practice session complete!");
                Gamification.updateStreak();
                this.navigateTo('dashboard-view');
                this.updateDashboard();
            }
        },

        speakWord() {
            if (!('speechSynthesis' in window)) return;
            const word = this.state.practiceSession.currentWord;
            if (!word) return;

            // Cancel any previous speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(word.text);
            utterance.rate = this.state.settings.speechRate;
            if (this.state.settings.voice) {
                const voice = this.state.voices.find(v => v.name === this.state.settings.voice);
                if (voice) utterance.voice = voice;
            }
            
            console.log('Speaking:', utterance);
            speechSynthesis.speak(utterance);
        },

        checkSpelling() {
            const userInput = document.getElementById('spell-input').value.trim().toLowerCase();
            const correctSpelling = this.state.practiceSession.currentWord.text.toLowerCase();
            const isCorrect = userInput === correctSpelling;
            this.state.practiceSession.lastAnswerCorrect = isCorrect;

            document.getElementById('feedback-text').textContent = isCorrect ? 'Correct!' : 'Incorrect!';
            document.getElementById('correct-spelling-text').textContent = correctSpelling;
            this.renderDiff(userInput, correctSpelling);
            document.getElementById('feedback-container').style.display = 'block';
            document.getElementById('spell-input').disabled = true;

            if (isCorrect) {
                confetti.create(window.innerWidth / 2, window.innerHeight / 2);
                this.state.practiceSession.correctStreak++;
                if (this.state.practiceSession.correctStreak >= 10) {
                    if(Gamification.unlockAchievement('PERFECT_SPELLER')) {
                        alert('Achievement Unlocked: Perfect Speller!');
                    }
                }
            } else {
                this.state.practiceSession.correctStreak = 0;
            }
        },

        rateWord(quality) {
            const word = this.state.practiceSession.currentWord;
            const wasSpelledCorrectly = this.state.practiceSession.lastAnswerCorrect;

            Gamification.processAnswer(wasSpelledCorrectly, quality, Date.now() - this.state.practiceSession.startTime, word);

            // If the user spelled it wrong, we force a low quality score for the SM-2 algorithm.
            const sm2Quality = wasSpelledCorrectly ? quality : 0;
            const updatedWord = SM2.calculate(sm2Quality, word);
            const wordIndex = this.state.words.findIndex(w => w.id === updatedWord.id);
            if (wordIndex > -1) {
                this.state.words[wordIndex] = updatedWord;
                this.saveWords();
            }

            // Session logic: if spelled wrong, relearn it now.
            if (!wasSpelledCorrectly) {
                this.state.practiceSession.relearningQueue.push(word);
            } else {
                // Spelled correctly, so we can introduce a new word from the master queue.
                if (this.state.practiceSession.masterQueue.length > 0) {
                    this.state.practiceSession.activeQueue.push(this.state.practiceSession.masterQueue.shift());
                }
            }
            
            this.nextWord();
        },

        renderWordList() {
            const container = document.getElementById('word-list-container');
            container.innerHTML = '';
            this.state.words.forEach(word => {
                const item = document.createElement('div');
                item.className = 'word-item';
                item.innerHTML = `
                    <span>${word.text}</span>
                    <div>
                        <button class="btn-icon edit-word-btn" data-id="${word.id}">✏️</button>
                        <button class="btn-icon delete-word-btn" data-id="${word.id}">🗑️</button>
                    </div>
                `;
                container.appendChild(item);
            });
        },

        renderAchievements() {
            const container = document.getElementById('achievements-container');
            container.innerHTML = '';
            for (const key in Gamification.ACHIEVEMENTS) {
                const achievement = Gamification.achievements[key] || Gamification.ACHIEVEMENTS[key];
                const item = document.createElement('div');
                item.className = `achievement-badge ${achievement.unlocked ? 'unlocked' : ''}`;
                item.innerHTML = `
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                `;
                container.appendChild(item);
            }
        },

        renderCalendarHeatmap() {
            const container = document.getElementById('heatmap-container');
            container.innerHTML = '';
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 29);

            for (let i = 0; i < 30; i++) {
                const day = new Date(thirtyDaysAgo);
                day.setDate(thirtyDaysAgo.getDate() + i);
                const dayString = day.toISOString().split('T')[0];
                const dayData = Storage.get(`gamification_stats_${dayString}`);
                
                const cell = document.createElement('div');
                cell.className = 'heatmap-day';
                if (dayData && (dayData.correct > 0 || dayData.incorrect > 0)) {
                    cell.style.backgroundColor = 'var(--primary-color)';
                }
                container.appendChild(cell);
            }
        },

        renderDiff(str1, str2) {
            const diffContainer = document.getElementById('diff-container');
            diffContainer.innerHTML = '';
            // Simple diff implementation
            for (let i = 0; i < Math.max(str1.length, str2.length); i++) {
                const char1 = str1[i];
                const char2 = str2[i];
                const span = document.createElement('span');
                if (char1 === char2) {
                    span.textContent = char2;
                    span.style.color = 'var(--correct-color)';
                } else {
                    span.textContent = char2 || '';
                    span.style.color = 'var(--incorrect-color)';
                    span.style.textDecoration = 'underline';
                }
                diffContainer.appendChild(span);
            }
        },

        showWordModal(wordId = null) {
            const modal = document.getElementById('word-modal');
            const title = document.getElementById('word-modal-title');
            const input = document.getElementById('word-input');
            if (wordId) {
                this.state.editingWordId = wordId;
                const word = this.state.words.find(w => w.id === wordId);
                title.textContent = 'Edit Word';
                input.value = word.text;
            } else {
                this.state.editingWordId = null;
                title.textContent = 'Add Word';
                input.value = '';
            }
            modal.style.display = 'flex';
            input.focus();
        },

        saveWord() {
            const input = document.getElementById('word-input');
            const wordText = input.value.trim();
            if (wordText.length === 0) return;

            if (this.state.editingWordId) {
                // Edit existing word
                const wordIndex = this.state.words.findIndex(w => w.id === this.state.editingWordId);
                this.state.words[wordIndex].text = wordText;
            } else {
                // Add new word
                if (!this.state.words.some(w => w.text.toLowerCase() === wordText.toLowerCase())) {
                    const newWord = SM2.createWord(wordText);
                    this.state.words.push(newWord);
                    if(Gamification.unlockAchievement('WORD_SMITH')) {
                        alert('Achievement Unlocked: Word Smith!');
                    }
                } else {
                    alert('Word already exists!');
                }
            }
            this.saveWords();
            this.renderWordList();
            this.closeModals();
        },

        deleteWord(wordId) {
            if (confirm('Are you sure you want to delete this word?')) {
                this.state.words = this.state.words.filter(w => w.id !== wordId);
                this.saveWords();
                this.renderWordList();
            }
        },

        deleteAllWords() {
            if (confirm('Are you sure you want to delete ALL words? This cannot be undone.')) {
                this.state.words = [];
                this.saveWords();
                this.renderWordList();
            }
        },

        showImportModal() {
            document.getElementById('import-modal').style.display = 'flex';
        },

        closeModals() {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        },

        importWords() {
            const text = document.getElementById('import-textarea').value;
            const words = text.split('\n').filter(w => w.trim().length > 0);
            let count = 0;
            words.forEach(wordText => {
                if (!this.state.words.some(w => w.text.toLowerCase() === wordText.toLowerCase())) {
                    const newWord = SM2.createWord(wordText);
                    this.state.words.push(newWord);
                    count++;
                }
            });
            if (count > 0) {
                this.saveWords();
                this.renderWordList();
            }
            this.closeModals();
        },

        importFromFile(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.words) this.state.words = data.words;
                    if (data.settings) this.state.settings = data.settings;
                    if (data.gamification) {
                        Gamification.points = data.gamification.points || 0;
                        Gamification.level = data.gamification.level || 1;
                        Gamification.achievements = data.gamification.achievements || Gamification.ACHIEVEMENTS;
                        Gamification.streak = data.gamification.streak || { current: 0, longest: 0, lastDate: null };
                        Gamification.save();
                    }
                    this.saveWords();
                    this.saveSettings();
                    this.applySettings();
                    this.render();
                    this.updateDashboard();
                    alert('Data imported successfully!');
                } catch (err) {
                    console.error(err);
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        },

        exportData() {
            const data = {
                words: this.state.words,
                settings: this.state.settings,
                gamification: {
                    points: Gamification.points,
                    level: Gamification.level,
                    achievements: Gamification.achievements,
                    streak: Gamification.streak
                }
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'spelling-bee-data.json';
            a.click();
            URL.revokeObjectURL(url);
        },

        toggleTheme(isDark) {
            document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
            this.state.settings.theme = isDark ? 'dark' : 'light';
            this.saveSettings();
        },

        populateVoices() {
            this.state.voices = speechSynthesis.getVoices();
            if (this.state.voices.length === 0) return;

            const voiceSelect = document.getElementById('voice-select');
            voiceSelect.innerHTML = '';
            this.state.voices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = voice.name;
                voiceSelect.appendChild(option);
            });

            // If no voice is saved in settings, try to find a good default
            if (!this.state.settings.voice) {
                let defaultVoice = this.state.voices.find(v => v.lang === 'en-US');
                if (!defaultVoice) {
                    defaultVoice = this.state.voices.find(v => v.lang.startsWith('en'));
                }
                if (defaultVoice) {
                    this.state.settings.voice = defaultVoice.name;
                    this.saveSettings();
                }
            }

            if (this.state.settings.voice) {
                voiceSelect.value = this.state.settings.voice;
            }
        },

        resetProgress() {
            if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
                Storage.remove('words');
                Storage.remove('settings');
                Storage.remove('gamification_points');
                Storage.remove('gamification_level');
                Storage.remove('gamification_achievements');
                Storage.remove('gamification_streak');
                // Also need to remove daily stats
                
                // Re-initialize the app state
                this.loadData();
                Gamification.init();
                this.applySettings();
                this.render();
                this.updateDashboard();
                alert('Progress has been reset.');
            }
        },

        saveWords() {
            Storage.set('words', this.state.words);
        },

        saveSettings() {
            Storage.set('settings', this.state.settings);
        }
    };

    App.init();
});
