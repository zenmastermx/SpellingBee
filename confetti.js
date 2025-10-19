const confetti = {
    create(x, y) {
        const confettiCount = 100;
        const colors = ['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6'];
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
            confettiEl.style.transform = 'translate(0, 0)';
            document.body.appendChild(confettiEl);

            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 200 + 100;
                const translateX = Math.cos(angle) * radius;
                const translateY = Math.sin(angle) * radius;
                confettiEl.style.transform = `translate(${translateX}px, ${translateY}px)`;
                confettiEl.style.opacity = 0;
            }, 10);

            setTimeout(() => {
                confettiEl.remove();
            }, 1010);
        }
    }
};
