// Get selected characters from localStorage
const player1Character = localStorage.getItem('player1Character');
const player2Character = localStorage.getItem('player2Character');

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = 12;
const MOVE_SPEED = 5;
const LIGHT_COOLDOWN = 500;
const HEAVY_COOLDOWN = 1000;
const DODGE_COOLDOWN = 1500;
const ULTIMATE_REQUIRED = 100;
const ATTACK_RANGE = 80;
const KNOCKBACK_FORCE = 8;

// Player objects
const player1 = {
    element: document.getElementById('player1'),
    x: 100,
    y: 0,
    velX: 0,
    velY: 0,
    health: characterStats[player1Character].health,
    maxHealth: characterStats[player1Character].health,
    ultimate: 0,
    lightCooldown: 0,
    heavyCooldown: 0,
    dodgeCooldown: 0,
    facing: 1
};

const player2 = {
    element: document.getElementById('player2'),
    x: window.innerWidth - 200,
    y: 0,
    velX: 0,
    velY: 0,
    health: characterStats[player2Character].health,
    maxHealth: characterStats[player2Character].health,
    ultimate: 0,
    lightCooldown: 0,
    heavyCooldown: 0,
    dodgeCooldown: 0,
    facing: -1
};

// Key states
const keys = {};

// Add both lowercase and uppercase key options
document.addEventListener('keydown', (e) => {
    // Handle arrow keys specially
    if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
    else if (e.key === 'ArrowRight') keys['arrowright'] = true;
    else keys[e.key.toLowerCase()] = true;
    
    console.log('Keys state:', keys); // Debug log
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
    else if (e.key === 'ArrowRight') keys['arrowright'] = false;
    else keys[e.key.toLowerCase()] = false;
});

function updatePlayer(player, opponent, moveKeys, attackKeys) {
    // Movement
    if (keys[moveKeys.left]) {
        player.velX = -MOVE_SPEED;
        player.facing = -1;
        player.element.style.setProperty('--facing', player.facing);
    } else if (keys[moveKeys.right]) {
        player.velX = MOVE_SPEED;
        player.facing = 1;
        player.element.style.setProperty('--facing', player.facing);
    } else {
        player.velX = 0;
    }

    // Apply gravity and update position
    player.velY += GRAVITY;
    player.y += player.velY;
    player.x += player.velX;

    // Floor collision
    if (player.y > 0) {
        player.y = 0;
        player.velY = 0;
    }

    // Wall collisions
    if (player.x < 0) player.x = 0;
    if (player.x > window.innerWidth - 60) player.x = window.innerWidth - 60;

    // Update cooldowns
    if (player.lightCooldown > 0) player.lightCooldown -= 16;
    if (player.heavyCooldown > 0) player.heavyCooldown -= 16;
    if (player.dodgeCooldown > 0) player.dodgeCooldown -= 16;

    // Update position and facing direction separately
    player.element.style.left = `${player.x}px`;
    player.element.style.bottom = `${100 - player.y}px`; // Adjust for bottom positioning
    player.element.style.transform = `scaleX(${player.facing})`;
    
    // Debug logging
    console.log(`Player 2 position: x=${player2.x}, y=${player2.y}, facing=${player2.facing}`);
    console.log(`Player 2 element:`, player2.element.style.cssText);
}

function performAttack(attacker, defender, damage, isHeavy) {
    // Check cooldowns
    if (isHeavy && attacker.heavyCooldown > 0) return;
    if (!isHeavy && attacker.lightCooldown > 0) return;

    console.log(`${isHeavy ? 'Heavy' : 'Light'} attack performed!`);

    // Always play attack animation
    if (isHeavy) {
        attacker.heavyCooldown = 1000; // 1 second
        attacker.element.classList.add('heavy-attack');
    } else {
        attacker.lightCooldown = 500; // 0.5 seconds
        attacker.element.classList.add('light-attack');
    }

    // Create attack effect in front of player
    const attackX = attacker.facing === 1 ? 
        attacker.x + 60 : // Attack effect to the right
        attacker.x - 30;  // Attack effect to the left
    createAttackEffect(attackX, 50, isHeavy, attacker.facing);

    // Calculate if hit lands
    const attackerCenter = attacker.x + 30;
    const defenderCenter = defender.x + 30;
    const distance = Math.abs(attackerCenter - defenderCenter);

    // Only apply damage and knockback if in range
    if (distance <= ATTACK_RANGE) {
        // Apply damage
        defender.health = Math.max(0, defender.health - damage);
        
        // Knockback
        const direction = attackerCenter < defenderCenter ? 1 : -1;
        defender.velX = KNOCKBACK_FORCE * direction;
        
        // Create hit effect on defender
        createHitEffect(defender.x + 30, 50, isHeavy);
        
        // Update ultimate meter
        attacker.ultimate = Math.min(100, attacker.ultimate + damage);
    }
    
    // Remove attack animation class
    setTimeout(() => {
        attacker.element.classList.remove('heavy-attack', 'light-attack');
    }, 300);
}

// New function for attack effects
function createAttackEffect(x, y, isHeavy, facing) {
    const effect = document.createElement('div');
    effect.className = `attack-effect ${isHeavy ? 'heavy' : 'light'}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.transform = `scaleX(${facing})`;
    document.querySelector('.game-container').appendChild(effect);
    
    setTimeout(() => effect.remove(), 300);
}

function createHitEffect(x, y, isHeavy) {
    const effect = document.createElement('div');
    effect.className = `hit-effect ${isHeavy ? 'heavy' : 'light'}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    document.querySelector('.game-container').appendChild(effect);
    
    // Remove effect after animation
    setTimeout(() => effect.remove(), 300);
}

function gameLoop() {
    // Update player 1 (WASD controls)
    updatePlayer(player1, player2, 
        { left: 'a', right: 'd' },
        { light: 'z', heavy: 'x' }
    );

    // Update player 2 (Arrow keys)
    updatePlayer(player2, player1,
        { left: 'arrowleft', right: 'arrowright' },
        { light: 'o', heavy: 'p' }
    );

    // Attack checks for Player 1
    if (keys['z']) {
        console.log('P1 Light Attack!');
        performAttack(player1, player2, characterStats[player1Character].lightDamage, false);
    }
    if (keys['x']) {
        console.log('P1 Heavy Attack!');
        performAttack(player1, player2, characterStats[player1Character].heavyDamage, true);
    }

    // Attack checks for Player 2
    if (keys['o']) {
        console.log('P2 Light Attack!');
        performAttack(player2, player1, characterStats[player2Character].lightDamage, false);
    }
    if (keys['p']) {
        console.log('P2 Heavy Attack!');
        performAttack(player2, player1, characterStats[player2Character].heavyDamage, true);
    }

    // Update health bars
    document.getElementById('health1-fill').style.width = 
        `${(player1.health / player1.maxHealth) * 100}%`;
    document.getElementById('health2-fill').style.width = 
        `${(player2.health / player2.maxHealth) * 100}%`;

    // Update ultimate meters
    document.getElementById('ultimate1-fill').style.width = 
        `${(player1.ultimate / 100) * 100}%`;
    document.getElementById('ultimate2-fill').style.width = 
        `${(player2.ultimate / 100) * 100}%`;

    requestAnimationFrame(gameLoop);
}

// Initialize players with debug logging
console.log("Initializing players...");
console.log("Player 2 character:", player2Character);
console.log("Player 2 stats:", characterStats[player2Character]);

// Update player initialization
function initializePlayers() {
    // Set character type
    player1.element.setAttribute('data-character', player1Character);
    player2.element.setAttribute('data-character', player2Character);

    // Apply character styles
    player1.element.style.background = characterStats[player1Character].style;
    player2.element.style.background = characterStats[player2Character].style;

    // Add idle animation class
    player1.element.classList.add('idle-animation');
    player2.element.classList.add('idle-animation');
}

// Call this after creating player objects
initializePlayers();

// Start the game loop with debug info
console.log("Starting game loop...");
gameLoop(); 