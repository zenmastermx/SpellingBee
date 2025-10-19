const SM2 = {
    /**
     * Calculates new SM-2 parameters for a word.
     * @param {number} quality - The user's rating of how well they knew the word (0-5).
     * @param {object} word - The word object, containing easeFactor, repetitions, and interval.
     * @returns {object} - The updated word object with new easeFactor, repetitions, and interval.
     */
    calculate(quality, word) {
        let { easeFactor, repetitions, interval } = word;

        if (quality < 3) {
            repetitions = 0;
            interval = 1;
        } else {
            repetitions += 1;
            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }

            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (easeFactor < 1.3) {
                easeFactor = 1.3;
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextReview = new Date(today.getTime() + interval * 24 * 60 * 60 * 1000);

        return {
            ...word,
            easeFactor,
            repetitions,
            interval,
            nextReview: nextReview.toISOString(),
            lastReviewed: new Date().toISOString(),
        };
    },

    /**
     * Creates a new word object with default SM-2 values.
     * @param {string} text - The word to create.
     * @returns {object} - The new word object.
     */
    createWord(text) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: text,
            easeFactor: 2.5,
            repetitions: 0,
            interval: 0, // Set to 0 so it's due for review immediately
            nextReview: today.toISOString(),
            createdAt: new Date().toISOString(),
            lastReviewed: null,
            history: [] // To track performance over time
        };
    }
};
