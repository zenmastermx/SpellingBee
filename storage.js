const Storage = {
    get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        if (value === null || value === 'undefined') {
            return defaultValue;
        }
        try {
            const parsed = JSON.parse(value);
            // If parsing results in null, and the original value wasn't the string 'null', treat as default.
            // This handles the case where localStorage contains the literal string 'null'.
            return parsed === null && value !== 'null' ? defaultValue : parsed;
        } catch (e) {
            console.error(`Error parsing JSON from localStorage key: ${key}`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error setting localStorage key: ${key}`, e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};
