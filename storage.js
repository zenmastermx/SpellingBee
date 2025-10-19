const Storage = {
    get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : defaultValue;
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
