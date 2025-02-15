const characterStats = {
    warrior: {
        name: 'Warrior',
        health: 250,
        speed: 4,
        lightDamage: 7,
        heavyDamage: 12,
        lightStunDuration: 300, //light stun duration
        heavyStunDuration: 800, //heavy stun duration
        style: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        stats: {
            health: 3,
            speed: 2,
            power: 3
        }
    },
    ninja: {
        name: 'Ninja',
        health: 180,
        speed: 7,
        lightDamage: 5,
        heavyDamage: 9,
        lightStunDuration: 300, //light stun duration
        heavyStunDuration: 800, //heavy stun duration
        style: 'linear-gradient(135deg, #3498db, #2980b9)',
        stats: {
            health: 2,
            speed: 3,
            power: 2
        }
    },
    mage: {
        name: 'Mage',
        health: 150,
        speed: 5,
        lightDamage: 8,
        heavyDamage: 15,
        lightStunDuration: 300, //light stun duration
        heavyStunDuration: 800, //heavy stun duration
        style: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
        stats: {
            health: 1,
            speed: 2,
            power: 3
        }
    }
};

function createCharacterCards() {
    const grid = document.querySelector('.character-grid');
    Object.entries(characterStats).forEach(([id, char]) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.character = id;
        card.innerHTML = `
            <div class="character-preview" style="background: ${char.style}"></div>
            <div class="character-info">
                <div class="character-name">${char.name}</div>
                <div class="character-stats">
                    Health: ${'★'.repeat(char.stats.health)}${'☆'.repeat(3-char.stats.health)}<br>
                    Speed: ${'★'.repeat(char.stats.speed)}${'☆'.repeat(3-char.stats.speed)}<br>
                    Power: ${'★'.repeat(char.stats.power)}${'☆'.repeat(3-char.stats.power)}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function logCharacterSelection() {
    console.log('Player 1:', localStorage.getItem('player1Character'));
    console.log('Player 2:', localStorage.getItem('player2Character'));
} 