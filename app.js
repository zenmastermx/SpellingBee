document.addEventListener('DOMContentLoaded', () => {
    const VoiceManager = {
        _voices: null,
        _promise: null,
        getVoices() {
            if (this._voices) {
                return Promise.resolve(this._voices);
            }
            if (this._promise) {
                return this._promise;
            }
            this._promise = new Promise((resolve) => {
                const getAndResolve = () => {
                    const voiceList = speechSynthesis.getVoices();
                    if (voiceList.length > 0) {
                        this._voices = voiceList;
                        resolve(this._voices);
                    }
                };
                if ('onvoiceschanged' in speechSynthesis) {
                    speechSynthesis.onvoiceschanged = getAndResolve;
                }
                getAndResolve(); // Initial attempt
            });
            return this._promise;
        }
    };

    const App = {
        VERSION: '1.0.5',
        state: {
            words: [],
            settings: {},
            practiceSession: {
                masterQueue: [],
                activeQueue: [],
                relearningQueue: [],
                newWordsIntroducedToday: [],
                currentWord: null,
                startTime: null,
                correctStreak: 0,
                lastAnswerCorrect: null,
            },
            editingWordId: null,
        },

        init() {
            if (!('speechSynthesis' in window)) {
                alert("Lo sentimos, tu navegador no soporta texto a voz. La función principal de esta aplicación no funcionará.");
                document.getElementById('play-word-btn').disabled = true;
            }

            this.loadData();
            this.setupEventListeners();
            this.setupUIEnhancements();
            this.populateVoices();
            this.applySettings();
            Gamification.init();
            this.render();
            this.updateDashboard();
        },

        setupUIEnhancements() {
            // Listen for streak updates
            window.addEventListener('streakUpdate', (e) => {
                const streakDisplay = document.getElementById('streak-display');
                if (streakDisplay) {
                    UIUtils.triggerAnimation(streakDisplay, 'streak-pop', 600);
                }
            });

            // Add input field typing animation
            const spellInput = document.getElementById('spell-input');
            if (spellInput) {
                spellInput.addEventListener('input', (e) => {
                    e.target.classList.add('typing');
                    clearTimeout(e.target._typingTimer);
                    e.target._typingTimer = setTimeout(() => {
                        e.target.classList.remove('typing');
                    }, 150);
                });
            }
        },

        loadData() {
            this.state.words = Storage.get('words', this.getSampleWords());
            this.state.settings = Storage.get('settings', {
                speechRate: 1.0,
                voice: null,
                dailyGoal: 20,
                sound: true,
                theme: 'dark',
            });
        },

        getSampleWords() {
            const sampleWords = [
                'Greece', 'Vikings', 'achieve', 'adapt', 'advantage', 'advertisement', 'among', 'appearance', 'archeologists', 'ashamed',
                'balance', 'behavior', 'belief', 'british', 'business', 'capable', 'career', 'century', 'certainly', 'challenge',
                'committee', 'critically', 'define', 'deliver', 'device', 'different', 'disappear', 'discount', 'discussed', 'due',
                'effect', 'effort', 'engineer', 'enough', 'essential', 'famous', 'fashion', 'fasten', 'feature', 'forgetting',
                'freedom', 'garbage', 'gather', 'generous', 'government', 'guidebook', 'habit', 'handle', 'healthy', 'heritage',
                'highway', 'history', 'huge', 'identify', 'illegal', 'improve', 'independent', 'indigenous', 'injuries', 'instead',
                'interrupt', 'interviewed', 'irresponsible', 'issues', 'journey', 'judge', 'justice', 'keen', 'keyboard', 'kindness',
                'knowledge', 'lake', 'language', 'lawyer', 'leak', 'length', 'liberty', 'literature', 'local', 'manage',
                'measure', 'meeting', 'memory', 'method', 'minorities', 'mythology', 'narrative', 'necessary', 'notice', 'novel',
                'nowadays', 'nurture', 'nutritious', 'parade', 'participate', 'patient', 'pattern', 'peaceful', 'pollute', 'possibility',
                'poverty', 'proud', 'quality', 'quantity', 'quickly', 'quiet', 'quite', 'quote', 'racist', 'raise', 'react', 'reason',
                'reasonable', 'recycle', 'refugees', 'resources', 'responsibility', 'science', 'season', 'seriously', 'sketch', 'slavery',
                'statement', 'streaming', 'summarize', 'supposedly', 'survey', 'talent', 'theory', 'thoughts', 'trace', 'tradition',
                'trust', 'understand', 'unfortunately', 'unique', 'until', 'update', 'useful', 'usually', 'vacancies', 'vacation',
                'valuable', 'variety', 'veggies', 'village', 'virtue', 'warmth', 'wealth', 'weather', 'wisdom', 'wonder', 'xylophone',
                'yawn', 'yet', 'yield', 'youth'
            ];
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
            // Rating buttons in the modal
            document.querySelector('#spelling-feedback-modal .rating-buttons').addEventListener('click', e => {
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
            document.getElementById('spelling-feedback-close-btn').addEventListener('click', () => {
                console.log('Close button clicked');
                document.getElementById('spelling-feedback-modal').style.display = 'none';
            });
            document.getElementById('repeat-spelling-feedback-btn').addEventListener('click', () => {
                console.log('Repeat button clicked');
                this.speakWordLetterByLetter(true);
            });
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
                if (typeof SoundManager !== 'undefined') {
                    SoundManager.setEnabled(e.target.checked);
                }
                this.saveSettings();
            });
            document.getElementById('reset-progress-btn').addEventListener('click', () => this.resetProgress());

            // The VoiceManager now handles the onvoiceschanged event.
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
            if (typeof SoundManager !== 'undefined') {
                SoundManager.setEnabled(this.state.settings.sound);
            }
        },

        render() {
            document.getElementById('app-version').textContent = this.VERSION;
            this.renderWordList();
            this.renderAchievements();
            this.renderCalendarHeatmap();
        },

        navigateTo(viewId) {
            const currentView = document.querySelector('.view.active');
            const nextView = document.getElementById(viewId);

            if (currentView && currentView !== nextView) {
                // Slide out current view
                currentView.classList.add('view-exit');
                setTimeout(() => {
                    currentView.classList.remove('active', 'view-exit');
                }, 300);
            }

            // Slide in next view
            if (nextView) {
                nextView.classList.add('view-enter');
                setTimeout(() => {
                    nextView.classList.add('active');
                    nextView.classList.remove('view-enter');
                }, 10);
            }

            // Update nav buttons
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const navBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
            if (navBtn) {
                navBtn.classList.add('active');
            }
        },

        updateDashboard() {
            // Update level display
            const levelDisplay = document.getElementById('level-display');
            const newLevelText = `Nivel ${Gamification.level}`;
            if (levelDisplay.textContent !== newLevelText) {
                levelDisplay.textContent = newLevelText;
            }

            // Update points display
            document.getElementById('points-display').textContent = `${Gamification.points} Puntos`;

            // Update XP bar
            const xpForLevel = (Gamification.level - 1) * Gamification.LEVEL_XP;
            const currentXp = Gamification.points - xpForLevel;
            document.getElementById('xp-bar').value = currentXp;
            document.getElementById('xp-bar').max = Gamification.LEVEL_XP;

            // Update streak display
            document.getElementById('streak-display').textContent = `🔥 ${Gamification.streak.current}`;

            // Animated stat updates
            const mastered = this.state.words.filter(w => w.interval > 21).length;
            if (typeof UIUtils !== 'undefined') {
                UIUtils.updateStatWithAnimation('mastered-words-count', mastered);

                // Update longest streak with animation
                const longestStreakEl = document.getElementById('longest-streak-count');
                const oldStreak = parseInt(longestStreakEl.textContent) || 0;
                const newStreak = Gamification.streak.longest;

                if (oldStreak !== newStreak) {
                    const statCard = longestStreakEl.closest('.stat-card');
                    if (statCard && newStreak > oldStreak) {
                        UIUtils.triggerAnimation(statCard, 'stat-increase', 800);
                    }
                    UIUtils.animateNumber(longestStreakEl, oldStreak, newStreak);
                    // Add " días" after animation completes
                    setTimeout(() => {
                        longestStreakEl.textContent = `${newStreak} días`;
                    }, 820);
                }
            } else {
                document.getElementById('mastered-words-count').textContent = mastered;
                document.getElementById('longest-streak-count').textContent = `${Gamification.streak.longest} días`;
            }

            // Update today's accuracy
            document.getElementById('today-accuracy').textContent = `${Gamification.getTodayAccuracy()}%`;

            // Update daily goal
            const dailyGoal = this.state.settings.dailyGoal;
            const newWordsToday = Gamification.getNewWordsTodayCount();
            const completedToday = Gamification.getReviewedTodayCount();
            document.getElementById('daily-goal-count').textContent = dailyGoal;
            document.getElementById('new-words-today-count').textContent = newWordsToday;
            document.getElementById('completed-today-count').textContent = completedToday;
            document.getElementById('daily-goal-progress').value = newWordsToday;
            document.getElementById('daily-goal-progress').max = dailyGoal;
        },

        startPractice() {
            const btn = document.getElementById('start-practice-btn');
            if (btn) {
                btn.classList.add('loading');
                btn.disabled = true;
            }

            // Add slight delay for loading animation effect
            setTimeout(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);

                // Get words due for review (repetitions > 0) and new words (repetitions === 0)
                const reviewWords = this.state.words
                    .filter(word => {
                        const nextReviewDate = new Date(word.nextReview);
                        return word.repetitions > 0 && nextReviewDate <= endOfToday;
                    })
                    .sort((a, b) => a.repetitions - b.repetitions || a.easeFactor - b.easeFactor);

                const newWords = this.state.words
                    .filter(word => {
                        const nextReviewDate = new Date(word.nextReview);
                        return word.repetitions === 0 && nextReviewDate <= endOfToday;
                    })
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                // Get today's new words introduced count
                const todayDateString = new Date().toISOString().split('T')[0];
                const newWordsIntroducedToday = Storage.get(`new_words_${todayDateString}`, []);

                if (reviewWords.length === 0 && newWords.length === 0) {
                    alert("¡No hay palabras para revisar hoy!");
                    if (btn) {
                        btn.classList.remove('loading');
                        btn.disabled = false;
                    }
                    return;
                }

                // Initialize session
                this.state.practiceSession.masterQueue = newWords;
                this.state.practiceSession.activeQueue = [...reviewWords]; // All review words go into active queue
                this.state.practiceSession.relearningQueue = [];
                this.state.practiceSession.newWordsIntroducedToday = newWordsIntroducedToday;
                this.state.practiceSession.correctStreak = 0;

                // Add initial new words up to daily goal if we haven't hit the limit
                const dailyGoal = this.state.settings.dailyGoal || 20;
                const remainingNewWords = dailyGoal - newWordsIntroducedToday.length;
                const newWordsToAdd = this.state.practiceSession.masterQueue.splice(0, Math.max(0, remainingNewWords));
                this.state.practiceSession.activeQueue.push(...newWordsToAdd);

                // Track new words introduced
                newWordsToAdd.forEach(word => {
                    if (!this.state.practiceSession.newWordsIntroducedToday.includes(word.id)) {
                        this.state.practiceSession.newWordsIntroducedToday.push(word.id);
                    }
                });

                this.nextWord();
                this.navigateTo('practice-view');

                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            }, 300);
        },

        nextWord() {
            document.getElementById('translation-container').style.display = 'none';
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
                alert("¡Sesión de práctica completada!");
                Gamification.updateStreak();
                this.navigateTo('dashboard-view');
                this.updateDashboard();
            }
        },

        async speakWord() {
            if (!('speechSynthesis' in window)) return;
            const word = this.state.practiceSession.currentWord;
            if (!word) return;

            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(word.text);
            utterance.rate = this.state.settings.speechRate;

            const voices = await VoiceManager.getVoices();
            const selectedVoiceName = this.state.settings.voice;

            if (selectedVoiceName) {
                const selectedVoice = voices.find(v => v.name === selectedVoiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    utterance.lang = selectedVoice.lang;
                }
            } else {
                // Fallback if no voice is selected
                utterance.lang = 'en-US';
            }
            
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
            };

            speechSynthesis.speak(utterance);
        },

        async speakWordLetterByLetter(isModal = false) {
            if (!('speechSynthesis' in window)) return;
            const word = this.state.practiceSession.currentWord;
            if (!word) return;

            if (isModal) {
                document.getElementById('repeat-spelling-feedback-btn').style.display = 'none';
                document.getElementById('spelling-feedback-close-btn').style.display = 'none';
            }

            // Clear previous highlights
            const letterSpans = document.querySelectorAll(isModal ? '#spelling-feedback-word span' : '#correct-spelling-text span');
            letterSpans.forEach(span => span.classList.remove('highlight'));

            speechSynthesis.cancel();

            const letters = word.text.split('');
            const voices = await VoiceManager.getVoices();
            const selectedVoiceName = this.state.settings.voice;
            let selectedVoice = null;

            if (selectedVoiceName) {
                selectedVoice = voices.find(v => v.name === selectedVoiceName);
            } else {
                selectedVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
            }

            // Create a single utterance with all letters separated by commas for faster pronunciation
            const letterString = letters.join(', ');
            const utterance = new SpeechSynthesisUtterance(letterString);
            utterance.rate = this.state.settings.speechRate;
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            }

            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
            };

            // Manually animate letters based on estimated timing
            let currentIndex = 0;
            // Adjusted timing: accounts for letter pronunciation + comma pause
            // Base timing of ~400ms per letter+comma at normal speed, scales with speech rate
            const letterDuration = 400 / this.state.settings.speechRate;

            const animateLetters = setInterval(() => {
                if (currentIndex < letters.length) {
                    const letterSpan = document.getElementById(isModal ? `feedback-letter-${currentIndex}` : `letter-${currentIndex}`);
                    if (letterSpan) {
                        letterSpan.classList.add('highlight');
                    }
                    currentIndex++;
                } else {
                    clearInterval(animateLetters);
                }
            }, letterDuration);

            // Speak the entire string at once
            await new Promise((resolve) => {
                utterance.onend = () => {
                    clearInterval(animateLetters);
                    resolve();
                };
                speechSynthesis.speak(utterance);
            });

            if (isModal) {
                document.getElementById('repeat-spelling-feedback-btn').style.display = 'inline-block';
                document.getElementById('spelling-feedback-close-btn').style.display = 'block';
                // Show rating buttons after spelling is complete
                const ratingButtons = document.querySelector('#spelling-feedback-modal .rating-buttons');
                if (ratingButtons) {
                    ratingButtons.style.display = 'flex';
                }
            }
        },

        async checkSpelling() {
            const userInput = document.getElementById('spell-input').value.trim().toLowerCase();
            const correctSpelling = this.state.practiceSession.currentWord.text.toLowerCase();
            const isCorrect = userInput === correctSpelling;
            this.state.practiceSession.lastAnswerCorrect = isCorrect;
            const spellInput = document.getElementById('spell-input');

            document.getElementById('feedback-text').textContent = isCorrect ? '¡Correcto!' : '¡Incorrecto!';
            this.renderDiff(userInput, correctSpelling);
            document.getElementById('feedback-container').style.display = 'block';
            document.getElementById('spell-input').disabled = true;

            // Show modal with correct spelling
            const modal = document.getElementById('spelling-feedback-modal');
            const wordEl = document.getElementById('spelling-feedback-word');
            const closeBtn = document.getElementById('spelling-feedback-close-btn');
            const repeatBtn = document.getElementById('repeat-spelling-feedback-btn');
            const resultIndicator = document.getElementById('spelling-result-indicator');
            const userSpellingDisplay = document.getElementById('user-spelling-display');
            const modalTranslationContainer = document.getElementById('modal-translation-container');
            const modalTranslationText = document.getElementById('modal-translation-text');

            // Show result indicator (checkmark or X)
            resultIndicator.textContent = isCorrect ? '✓' : '✗';
            resultIndicator.className = isCorrect ? 'correct' : 'incorrect';
            resultIndicator.style.display = 'block';

            // Show user's spelling if incorrect
            if (!isCorrect && userInput) {
                userSpellingDisplay.textContent = userInput;
                userSpellingDisplay.style.display = 'block';
            } else {
                userSpellingDisplay.style.display = 'none';
            }

            // Prepare word display
            wordEl.innerHTML = '';
            correctSpelling.split('').forEach((letter, index) => {
                const span = document.createElement('span');
                span.textContent = letter;
                span.id = `feedback-letter-${index}`;
                wordEl.appendChild(span);
            });

            // Get and display translation
            const translation = await this.getTranslation(correctSpelling, 'es');
            if (translation) {
                modalTranslationText.textContent = translation;
                modalTranslationContainer.style.display = 'block';
                // Also update the practice view translation
                document.getElementById('translation-text').textContent = translation;
                document.getElementById('translation-container').style.display = 'block';
            } else {
                modalTranslationContainer.style.display = 'none';
            }

            closeBtn.style.display = 'none';
            repeatBtn.style.display = 'none';
            // Hide rating buttons initially
            const ratingButtons = document.querySelector('#spelling-feedback-modal .rating-buttons');
            if (ratingButtons) {
                ratingButtons.style.display = 'none';
            }
            modal.style.display = 'flex';

            await this.speakWordLetterByLetter(true);

            if (isCorrect) {
                // Visual feedback for correct answer
                spellInput.classList.add('correct-flash');
                setTimeout(() => spellInput.classList.remove('correct-flash'), 600);

                // Enhanced confetti based on streak
                const streak = this.state.practiceSession.correctStreak + 1;
                const intensity = Math.min(100 + (streak * 10), 300);
                confetti.create(window.innerWidth / 2, window.innerHeight / 2, intensity);

                // Play success sound
                if (this.state.settings.sound && typeof SoundManager !== 'undefined') {
                    SoundManager.playSuccess();
                }

                this.state.practiceSession.correctStreak++;

                // Check for perfect speller achievement
                if (this.state.practiceSession.correctStreak >= 10) {
                    if(Gamification.unlockAchievement('PERFECT_SPELLER')) {
                        ToastManager.show('¡Logro Desbloqueado!', 'Deletreador Perfecto - ¡10 correctas seguidas!', '🏆');
                    }
                }
            } else {
                // Visual feedback for incorrect answer
                spellInput.classList.add('shake-error');
                setTimeout(() => spellInput.classList.remove('shake-error'), 400);

                // Play error sound
                if (this.state.settings.sound && typeof SoundManager !== 'undefined') {
                    SoundManager.playError();
                }

                this.state.practiceSession.correctStreak = 0;
            }
        },

        rateWord(quality) {
            // Close the spelling feedback modal
            const modal = document.getElementById('spelling-feedback-modal');
            if (modal) {
                modal.style.display = 'none';
            }

            const word = this.state.practiceSession.currentWord;
            const wasSpelledCorrectly = this.state.practiceSession.lastAnswerCorrect;

            // Calculate XP before processing
            const oldPoints = Gamification.points;
            Gamification.processAnswer(wasSpelledCorrectly, quality, Date.now() - this.state.practiceSession.startTime, word);
            Gamification.updateTodayStats(wasSpelledCorrectly, word.id);
            const earnedXP = Gamification.points - oldPoints;

            // Show floating XP if points were earned
            if (earnedXP > 0 && typeof UIUtils !== 'undefined') {
                const xpBar = document.getElementById('xp-bar');
                if (xpBar) {
                    const rect = xpBar.getBoundingClientRect();
                    UIUtils.showFloatingXP(rect.left + rect.width / 2, rect.top - 10, earnedXP);
                }

                // Animate XP bar
                xpBar.classList.add('xp-gaining');
                setTimeout(() => xpBar.classList.remove('xp-gaining'), 600);
            }

            // Add to word history
            const historyEntry = {
                date: new Date().toISOString(),
                correct: wasSpelledCorrectly,
                quality: quality,
                timeTaken: Date.now() - this.state.practiceSession.startTime
            };
            if (!word.history) {
                word.history = [];
            }
            word.history.push(historyEntry);

            // If the user spelled it wrong, we force a low quality score for the SM-2 algorithm.
            const sm2Quality = wasSpelledCorrectly ? quality : 0;
            const updatedWord = SM2.calculate(sm2Quality, word);
            const wordIndex = this.state.words.findIndex(w => w.id === updatedWord.id);
            if (wordIndex > -1) {
                this.state.words[wordIndex] = updatedWord;
                this.saveWords();
            }

            // Check for master mind achievement after SM-2 update
            if (wasSpelledCorrectly && updatedWord.interval > 21) {
                if (Gamification.unlockAchievement('MASTER_MIND')) {
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.show('¡Logro Desbloqueado!', 'Mente Maestra - ¡Dominaste tu primera palabra!', '🏆');
                    }
                }
            }

            // Session logic: if spelled wrong, relearn it now.
            if (!wasSpelledCorrectly) {
                this.state.practiceSession.relearningQueue.push(updatedWord);
            } else {
                // Spelled correctly, check if we can introduce a new word
                const dailyGoal = this.state.settings.dailyGoal || 20;
                const canIntroduceNewWord = this.state.practiceSession.newWordsIntroducedToday.length < dailyGoal
                    && this.state.practiceSession.masterQueue.length > 0;

                if (canIntroduceNewWord) {
                    const newWord = this.state.practiceSession.masterQueue.shift();
                    this.state.practiceSession.activeQueue.push(newWord);
                    this.state.practiceSession.newWordsIntroducedToday.push(newWord.id);
                    // Save new words introduced today
                    const todayDateString = new Date().toISOString().split('T')[0];
                    Storage.set(`new_words_${todayDateString}`, this.state.practiceSession.newWordsIntroducedToday);
                }
            }

            // Update dashboard with animations
            this.updateDashboard();

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
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${achievement.icon || '🏆'}</div>
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

                // Calculate intensity and apply colors
                if (dayData && (dayData.correct > 0 || dayData.incorrect > 0)) {
                    const total = dayData.correct + dayData.incorrect;
                    if (total === 0) {
                        // No activity
                    } else if (total <= 5) {
                        cell.style.backgroundColor = 'rgba(142, 68, 173, 0.3)';
                    } else if (total <= 15) {
                        cell.style.backgroundColor = 'rgba(142, 68, 173, 0.6)';
                    } else {
                        cell.style.backgroundColor = 'var(--primary-color)';
                        cell.style.boxShadow = '0 0 10px rgba(142, 68, 173, 0.5)';
                    }

                    // Add tooltip on hover
                    cell.addEventListener('mouseenter', (e) => {
                        const tooltip = document.createElement('div');
                        tooltip.className = 'heatmap-tooltip';
                        tooltip.textContent = `${dayData.correct} correctas, ${dayData.incorrect} incorrectas`;
                        tooltip.style.left = `${e.pageX}px`;
                        tooltip.style.top = `${e.pageY - 40}px`;
                        document.body.appendChild(tooltip);
                        cell._tooltip = tooltip;
                    });

                    cell.addEventListener('mouseleave', () => {
                        if (cell._tooltip) {
                            cell._tooltip.remove();
                            cell._tooltip = null;
                        }
                    });
                } else {
                    // No activity tooltip
                    cell.addEventListener('mouseenter', (e) => {
                        const tooltip = document.createElement('div');
                        tooltip.className = 'heatmap-tooltip';
                        tooltip.textContent = 'Sin actividad';
                        tooltip.style.left = `${e.pageX}px`;
                        tooltip.style.top = `${e.pageY - 40}px`;
                        document.body.appendChild(tooltip);
                        cell._tooltip = tooltip;
                    });

                    cell.addEventListener('mouseleave', () => {
                        if (cell._tooltip) {
                            cell._tooltip.remove();
                            cell._tooltip = null;
                        }
                    });
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
                title.textContent = 'Editar Palabra';
                input.value = word.text;
            } else {
                this.state.editingWordId = null;
                title.textContent = 'Agregar Palabra';
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
                        if (typeof ToastManager !== 'undefined') {
                            ToastManager.show('¡Logro Desbloqueado!', 'Forjador de Palabras - ¡Agregaste tu primera palabra personalizada!', '🏆');
                        }
                    }
                } else {
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.show('¡Ups!', 'Esta palabra ya existe en tu lista.', '⚠️');
                    } else {
                        alert('¡La palabra ya existe!');
                    }
                    return;
                }
            }
            this.saveWords();
            this.renderWordList();
            this.closeModals();
        },

        deleteWord(wordId) {
            if (confirm('¿Estás seguro de que quieres eliminar esta palabra?')) {
                this.state.words = this.state.words.filter(w => w.id !== wordId);
                this.saveWords();
                this.renderWordList();
            }
        },

        deleteAllWords() {
            if (confirm('¿Estás seguro de que quieres eliminar TODAS las palabras? Esto no se puede deshacer.')) {
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
                    alert('¡Datos importados exitosamente!');
                } catch (err) {
                    console.error(err);
                    alert('Archivo JSON inválido.');
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

        async populateVoices() {
            const voices = await VoiceManager.getVoices();
            const voiceSelect = document.getElementById('voice-select');
            voiceSelect.innerHTML = '';
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = voice.name;
                voiceSelect.appendChild(option);
            });

            // If no voice is saved in settings, try to find a good default English voice
            if (!this.state.settings.voice) {
                let defaultVoice = voices.find(v => v.lang === 'en-US');
                if (!defaultVoice) {
                    defaultVoice = voices.find(v => v.lang.startsWith('en'));
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

        async getTranslation(text, targetLang) {
            // This uses an unofficial, rate-limited, and potentially unstable API.
            // Do not use in a production environment where reliability is critical.
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data[0][0][0];
            } catch (error) {
                console.error("Translation error:", error);
                return null;
            }
        },

        resetProgress() {
            if (confirm('¿Estás seguro de que quieres restablecer todo tu progreso? Esto no se puede deshacer.')) {
                Storage.remove('words');
                Storage.remove('settings');
                Storage.remove('gamification_points');
                Storage.remove('gamification_level');
                Storage.remove('gamification_achievements');
                Storage.remove('gamification_streak');

                // Remove all daily stats and new words tracking for the past 90 days
                const today = new Date();
                for (let i = 0; i < 90; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateString = date.toISOString().split('T')[0];
                    Storage.remove(`gamification_stats_${dateString}`);
                    Storage.remove(`new_words_${dateString}`);
                }

                // Re-initialize the app state
                this.loadData();
                Gamification.init();
                this.applySettings();
                this.render();
                this.updateDashboard();
                alert('El progreso ha sido restablecido.');
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
