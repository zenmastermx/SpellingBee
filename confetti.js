const confetti = {
    create(x, y, intensity = 100, colorTheme = null) {
        const confettiCount = intensity;
        const colors = colorTheme || ['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6'];

        for (let i = 0; i < confettiCount; i++) {
            const confettiEl = document.createElement('div');
            confettiEl.style.position = 'absolute';
            confettiEl.style.left = `${x}px`;
            confettiEl.style.top = `${y}px`;
            confettiEl.style.width = `${Math.random() * 10 + 5}px`;
            confettiEl.style.height = `${Math.random() * 10 + 5}px`;
            confettiEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiEl.style.opacity = 1;
            confettiEl.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
            confettiEl.style.transform = 'translate(0, 0) rotate(0deg)';
            confettiEl.style.zIndex = '1000';
            confettiEl.style.pointerEvents = 'none';
            document.body.appendChild(confettiEl);

            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 200 + 100;
                const translateX = Math.cos(angle) * radius;
                const translateY = Math.sin(angle) * radius;
                const rotation = Math.random() * 720 - 360;
                confettiEl.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`;
                confettiEl.style.opacity = 0;
            }, 10);

            setTimeout(() => {
                confettiEl.remove();
            }, 1010);
        }
    },

    // Create streak-themed confetti (fire colors)
    streakBurst(x, y, streakCount) {
        const fireColors = ['#FF6B35', '#F7931E', '#FDC830', '#F37335', '#FF4500'];
        const intensity = Math.min(streakCount * 20, 300);
        this.create(x, y, intensity, fireColors);
    },

    // Create level-up confetti (full screen)
    levelUpExplosion() {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        this.create(x, y, 500);

        // Add secondary bursts
        setTimeout(() => {
            this.create(x - 200, y - 100, 200);
            this.create(x + 200, y - 100, 200);
        }, 200);
    }
};
