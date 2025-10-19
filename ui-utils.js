const UIUtils = {
    // Animate a number from start to end value
    animateNumber(element, start, end, duration = 800) {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = Math.round(end);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    },

    // Create floating XP text
    showFloatingXP(x, y, amount) {
        const floatingText = document.createElement('div');
        floatingText.className = 'xp-float';
        floatingText.textContent = `+${amount} XP`;
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        document.body.appendChild(floatingText);

        setTimeout(() => floatingText.remove(), 1500);
    },

    // Trigger a temporary CSS class animation
    triggerAnimation(element, className, duration = 600) {
        if (!element) return;

        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), duration);
    },

    // Pulse element
    pulseElement(elementId) {
        const element = document.getElementById(elementId);
        this.triggerAnimation(element, 'stat-increase', 800);
    },

    // Update stat card with animation
    updateStatWithAnimation(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const oldValue = parseInt(element.textContent) || 0;

        // Trigger pulse on parent stat card
        const statCard = element.closest('.stat-card');
        if (statCard && newValue > oldValue) {
            this.triggerAnimation(statCard, 'stat-increase', 800);
        }

        // Animate the number
        this.animateNumber(element, oldValue, newValue);
    }
};
