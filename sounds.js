const SoundManager = {
    enabled: true,

    // Simple beep sounds using base64-encoded WAV data
    sounds: {
        success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJ0fPTgjMGHm7A7+OZSA0NVKzn7qxbGAg+mN7yvmwjBTCH0PPZhjUGHm3A7+OZSAwNVK3n7q1bGgg+mN7zv2wiBTGHz/PYhjYGHW3A7+OZSAwNVK3n7q1bGgg+mN7zv2wiBTGI0PPZhjUGHW7A7uOZSAwOVK3n7qxcGQc+mN7zv2wiBTGI0PPZhjUGHW3A7uOYSAwOVK3n7qxcGQc9mN7zv2wjBTGI0fPZhjUGHW3A7uOYSAwOVK3n7qxcGQc9mN7zv2wjBTGI0fPZhjUGHW7A7uOYSAwOVK3n7qxcGQc9mN7zv2wjBTGI0fPZhjUGHW7A7uOYSAwOVK3n7qxcGQc9mN7zv2wjBTGI0fPZhjUGHW7A7+OYRwwOVK3m7q1cGQc9mN7zv2wjBTGI0PPZhTYGHW7A7+OYRwsOVa3m7q1cFwc+mN70wGwiBTGI0PPZhTYGHW7A7+OYRwsOVa3m7q1cFwc+l97zwGwiBDCH0fPahTYFHm7A7+OZRwsOVK3m761dFgg9l9700GwhBDCH0fPahTYFHm/A7uSZRwsOVK3m761dFgg9l9700GwhBDCH0fPahTYFHm/A7uSZRwsOVK3m761dFgg9l9700GwhBDCH0fPahTYFHm/A7uSZRwsOVK3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZRwsOVa3m761dFgg9l9700GwhBDCH0PPahTYFHm/A7uSZ',

        error: 'data:audio/wav;base64,UklGRhQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfADAACAgICAgICAgH9+fn1+fXx7enl4d3Z1dHNycG9ubWxramlpZ2ZlZGNiYWBfXl1bWllYV1ZUU1JQT05NTEpJR0ZFRENCQD8+PTw6OTc2NDMyMTAvLi0sKikoJyYkIyIhIB8dHBsZGBYVExIREA8ODQwLCgkIBwYEAwEBAQICAgQFBgcICQoLDQ4PEBETFBUWFxkaGxweHyEiIyUmJykqLC0uMDEzNDY3OTo8PT4/QUJDRUZISUpLTU5PUVNUVldYWltdXl9hYmNlZmhpamtsbnBxcnR1d3h5e3x9f4CAgYOEhYaIiYqLjI6PkJKTlJWXmJqbnJ6foKKjpaaop6mqq6ytrq+wsbKztLW1tra3t7i4uLm5ubq6urq6urq6urq5ubm4uLe3tra1tbSzsrGwr66trKqpqKakpKKhoJ6dnJqZl5aUk5GQjo2LioiHhYSCgYB+fXt6eHd1dHJxb21samnlNjVXnOXwtmMcBi+H0PPZhjUGHW7A7+OZSAwNVKzn7qxbGAg+mN7yvmwjBTCH0PPahTYFHm7A7+OYRwsOVa3m7q1cFwc+mN70wGwiBDCH0fPahTYFHm/A7uSZRwsOVK3m761dFgg9l9700GwhBDCH0fPahTYFHm/A7uSZRwsO',

        levelup: 'data:audio/wav;base64,UklGRjIGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4GAACAgYSHioyOkJKUlpeZm52foKKkpqepq62ur7CxsrO0tLW1tba2tra2tra1tbW0tLOzsrGwr62rqqinpqSioJ+dnJqYl5WTkY+Ni4mHhYOBgH9+fHt5eHZ1dHNycG9ubWxramlpZ2ZlZGNiYWBfXV1bWllYV1ZVU1JRUFBOTUxLSkpJSEhHRkZFREREQ0NDQkJCQkJCQkJCQ0NDREREhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqanqKmqqqurq6ysrKysrKurrKurqqmop6alpKOhoJ+dnJuamJeWlJOSj46NjIqJh4aEg4F/fXx6eXd2dHNxb21ramhnZWRiYV9eXFtZWFZVU1JQTk1LSkdGRENCQD89OzozMjAuLCspJyUiISAfHRsZGBYUEg8ODAsJBwYEAwEBAQECBAQGBwgKCgwNDxASExQWFxkaGx0eICEjJCYoKSssLi8xMzQ2Nzk7PT5AQkNFR0lKTE5PUFJUVVY=',

        streak: 'data:audio/wav;base64,UklGRiQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAAC/wcTGycvO0NPV19nb3d7f4eHi4+Pk5OTk5OTk4+Pi4eDf3dzb2djW1NLPzcrHxMG+u7i1sq+sqaajn5yZlpORjo2LiYmHhYWEg4KCgYGAgICBgYKCg4SEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpubnJ2en5+goKCgoKCfn56dnJuamJeWlJKRj42MiomHhoSCgX99fHp4d3V0cnFvbmxramloZ2VkY2JhYF9eXl1dXF1dXl5fYGFiY2RlZ2hpamxtbm9xc3R2d3l7fH5/gYOEhoeJioyNj5CSlJWXmJqcnZ6goaKkpaanqKmqq6ytrq+wsbGysrO0tLS0tLSzsrGxsK+urayrqqimnqWjn56bmpeLiIWCf3x4dXJvaWZiX1tYVFFOSkhEQT8=',

        click: 'data:audio/wav;base64,UklGRhwBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfgAAACAgICAgH9/f39+fn59fHt6eXh3dnRzcWxpZmNfXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAP//+/f39/Py7+vn4+De2tbSzsnFwby4s6+rp6Oem5aShX57d3NuaWVgXFdTTkpGQj49OTUxLSkmIh4aFhILCAQA/Pz49PPw7Ovp5uPg3dvZ1tTSz83Kx8XCwL67uLa0sbCuq6mno6Gcmpien5aXk5COiomGhIOBgH59fHt6enl4eXh5eHl5enp7e3x8fH18fn5/f4CAgYGCgoODg4SEhISFhYaGh4eIiImJiYqKioqLiouLjIyMjI2NjY2Ojo6Oj4+Pj5CQkJCQkZGRkZKSkpKSk5OTkw=='
    },

    play(soundKey, volume = 0.3) {
        if (!this.enabled) return;

        try {
            const audio = new Audio(this.sounds[soundKey]);
            audio.volume = volume;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio creation failed:', e);
        }
    },

    playSuccess() {
        this.play('success', 0.3);
    },

    playError() {
        this.play('error', 0.2);
    },

    playLevelUp() {
        this.play('levelup', 0.4);
    },

    playStreak() {
        this.play('streak', 0.35);
    },

    playClick() {
        this.play('click', 0.15);
    },

    setEnabled(enabled) {
        this.enabled = enabled;
    }
};
