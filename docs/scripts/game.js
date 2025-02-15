// Get selected characters from localStorage
const player1Character = localStorage.getItem('player1Character');
const player2Character = localStorage.getItem('player2Character');

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = 12;
const MOVE_SPEED = 5;
const DODGE_COOLDOWN = 3000;
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
    facing: -1,
    isStunned: false,
    stunDuration: 0,
    isDodging: false,
    invincible: false,
    dodgeStart: 0
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
    facing: 1,
    isStunned: false,
    stunDuration: 0,
    isDodging: false,
    invincible: false,
    dodgeStart: 0
};

// Key states
const keys = {};

// Add both lowercase and uppercase key options
document.addEventListener('keydown', (e) => {
    // Handle arrow keys specially
    if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
    else if (e.key === 'ArrowRight') keys['arrowright'] = true;
    else keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
    else if (e.key === 'ArrowRight') keys['arrowright'] = false;
    else keys[e.key.toLowerCase()] = false;
});

function performDodge(player) {
    if (player.dodgeCooldown > 0 || player.isStunned || player.isDodging) return;

    player.isDodging = true;
    player.invincible = true;
    player.dodgeStart = Date.now();
    player.dodgeCooldown = DODGE_COOLDOWN;
    
    // Add dodge animation class
    player.element.classList.add('dodging');
    
    // Move player in facing direction
    player.velX = -player.facing * 3; // Dodge speed
    
    // Remove dodge state after animation
    setTimeout(() => {
        player.isDodging = false;
        player.invincible = false;
        player.element.classList.remove('dodging');
        player.velX = 0;
    }, 400); // Match this with the CSS animation duration
}

function updatePlayer(player, opponent, moveKeys, attackKeys) {
    // Update stun duration
    if (player.stunDuration > 0) {
        player.stunDuration -= 16; // Decrease stun duration (16ms is roughly one frame)
        if (player.stunDuration <= 0) {
            player.isStunned = false;
            player.element.classList.remove('stunned');
        }
    }

    // If stunned or dodging, only apply current movement and gravity
    if (player.isStunned || player.isDodging) {
        // Apply gravity
        player.velY += GRAVITY;
        player.y += player.velY;
        
        // Apply current movement
        player.x += player.velX;
        
        // Add friction for stun knockback
        if (player.isStunned) {
            player.velX *= 0.9;
        }
        
        // Floor collision
        if (player.y > 0) {
            player.y = 0;
            player.velY = 0;
        }
        
        // Wall collisions
        if (player.x < 0) {
            player.x = 0;
            player.velX = 0;
        }
        if (player.x > window.innerWidth - 60) {
            player.x = window.innerWidth - 60;
            player.velX = 0;
        }
        
        // Update position
        player.element.style.left = `${player.x}px`;
        player.element.style.bottom = `${100 - player.y}px`;
        return;
    }

    // Regular movement only if not stunned and not dodging
    if (keys[moveKeys.left]) {
        player.velX = -MOVE_SPEED;
        player.facing = 1;
        player.element.style.setProperty('--facing', player.facing);
    } else if (keys[moveKeys.right]) {
        player.velX = MOVE_SPEED;
        player.facing = -1;
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

    // Update position and facing direction
    player.element.style.left = `${player.x}px`;
    player.element.style.bottom = `${100 - player.y}px`;
    player.element.style.transform = `scaleX(${player.facing})`;
}

function performAttack(attacker, defender, damage, isHeavy) {
    // Get character stats for cooldown times
    const attackerCharacter = attacker === player1 ? player1Character : player2Character;
    const attackerStats = characterStats[attackerCharacter];

    // Check cooldowns and stun status
    if (isHeavy && attacker.heavyCooldown > 0) return;
    if (!isHeavy && attacker.lightCooldown > 0) return;
    if (attacker.isStunned || attacker.isDodging) return;

    // Set cooldown based on character stats
    if (isHeavy) {
        attacker.heavyCooldown = attackerStats.heavyAttackCooldown;
        attacker.element.classList.add('heavy-attack');
    } else {
        attacker.lightCooldown = attackerStats.lightAttackCooldown;
        attacker.element.classList.add('light-attack');
    }

    // Create attack effect in front of player
    const attackX = attacker.facing === 1 ? 
        attacker.x - 30 : // Attack effect to the left when facing left
        attacker.x + 60;  // Attack effect to the right when facing right
    createAttackEffect(attackX, 50, isHeavy, attacker.facing);

    // Calculate if hit lands
    const attackerCenter = attacker.x + 30;
    const defenderCenter = defender.x + 30;
    const distance = Math.abs(attackerCenter - defenderCenter);

    // Only apply damage and effects if in range and target is not invincible
    if (distance <= ATTACK_RANGE && !defender.invincible) {
        // Apply damage
        defender.health = Math.max(0, defender.health - damage);
        
        // Apply knockback
        const direction = attackerCenter < defenderCenter ? 1 : -1;
        defender.velX = KNOCKBACK_FORCE * direction;
        
        // Apply stun effect
        defender.isStunned = true;
        defender.stunDuration = isHeavy ? 
            characterStats[attackerCharacter].heavyStunDuration :
            characterStats[attackerCharacter].lightStunDuration;
        
        // Add visual stun and knockback effects
        defender.element.classList.add('stunned');
        defender.element.classList.add('knockback');
        
        // Create hit effect
        createHitEffect(defender.x + 30, 50, isHeavy);
        
        // Update ultimate meter
        attacker.ultimate = Math.min(100, attacker.ultimate + damage);
        
        // Remove knockback class after animation
        setTimeout(() => {
            defender.element.classList.remove('knockback');
        }, 500);
    }
    
    // Remove attack animation class
    setTimeout(() => {
        attacker.element.classList.remove('heavy-attack', 'light-attack');
    }, 300);
}

function createAttackEffect(x, y, isHeavy, facing) {
    const effect = document.createElement('div');
    effect.className = `attack-effect ${isHeavy ? 'heavy' : 'light'}`;
    
    effect.style.position = 'absolute';
    effect.style.left = `${x}px`;
    effect.style.bottom = `${100 + y}px`;
    effect.style.transform = `scaleX(${-facing})`;
    effect.style.zIndex = '100';
    
    document.querySelector('.game-container').appendChild(effect);
    
    setTimeout(() => effect.remove(), 300);
}

function createHitEffect(x, y, isHeavy) {
    const effect = document.createElement('div');
    effect.className = `hit-effect ${isHeavy ? 'heavy' : 'light'}`;
    
    effect.style.position = 'absolute';
    effect.style.left = `${x}px`;
    effect.style.bottom = `${100 + y}px`;
    effect.style.zIndex = '100';
    
    document.querySelector('.game-container').appendChild(effect);
    
    setTimeout(() => effect.remove(), 300);
}
// end game logic 
function checkGameEnd() {
    if (player1.health <= 0 || player2.health <= 0) {
        const winner = player1.health > 0 ? player1 : player2;
        const winnerCharacter = player1.health > 0 ? player1Character : player2Character;
        showGameEndScreen(winner, winnerCharacter);
        return true;
    }
    return false;
}

function showGameEndScreen(winner, winnerCharacter) {
    const gameEndScreen = document.querySelector('.game-end-screen');
    const winnerCharacterElement = document.querySelector('.winner-character');
    
    // Update winner text
    winnerCharacterElement.textContent = characterStats[winnerCharacter].name;
    
    // Show the end screen
    gameEndScreen.classList.add('active');
    
    // Add event listeners to buttons
    const playAgainButton = document.querySelector('.play-again');
    const returnMenuButton = document.querySelector('.return-menu');
    
    playAgainButton.addEventListener('click', () => {
        location.reload();
    });
    
    returnMenuButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Check if game has ended
function checkGameEnd() {
    if (player1.health <= 0 || player2.health <= 0) {
        const winner = player1.health > 0 ? player1 : player2;
        const winnerCharacter = player1.health > 0 ? player1Character : player2Character;
        showGameEndScreen(winner, winnerCharacter);
        return true;
    }
    return false;
}

// Show the game end screen
function showGameEndScreen(winner, winnerCharacter) {
    const gameEndScreen = document.querySelector('.game-end-screen');
    const winnerCharacterElement = document.querySelector('.winner-character');
    
    // Update winner text
    winnerCharacterElement.textContent = characterStats[winnerCharacter].name;
    
    // Show the end screen
    gameEndScreen.classList.add('active');
    
    // Add event listeners to buttons
    const playAgainButton = document.querySelector('.play-again');
    const returnMenuButton = document.querySelector('.return-menu');
    
    playAgainButton.addEventListener('click', () => {
        location.reload();
    });
    
    returnMenuButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Main game loop
function gameLoop() {
    // Check if game has ended before updating
    if (!checkGameEnd()) {
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
        if (keys['z'] && !player1.isStunned) {
            performAttack(player1, player2, characterStats[player1Character].lightDamage, false);
        }
        if (keys['x'] && !player1.isStunned) {
            performAttack(player1, player2, characterStats[player1Character].heavyDamage, true);
        }

        // Attack checks for Player 2
        if (keys['o'] && !player2.isStunned) {
            performAttack(player2, player1, characterStats[player2Character].lightDamage, false);
        }
        if (keys['p'] && !player2.isStunned) {
            performAttack(player2, player1, characterStats[player2Character].heavyDamage, true);
        }

        // Dodge controls
        if (keys['v'] && !player1.isStunned) {
            performDodge(player1);
        }
        if (keys['u'] && !player2.isStunned) {
            performDodge(player2);
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

        // Update cooldown displays
        const p1LightCd = document.getElementById('p1-light-cd');
        const p1HeavyCd = document.getElementById('p1-heavy-cd');
        if (p1LightCd) p1LightCd.style.width = `${Math.max(0, (player1.lightCooldown / characterStats[player1Character].lightAttackCooldown) * 100)}%`;
        if (p1HeavyCd) p1HeavyCd.style.width = `${Math.max(0, (player1.heavyCooldown / characterStats[player1Character].heavyAttackCooldown) * 100)}%`;
        
        // Player 2
        const p2LightCd = document.getElementById('p2-light-cd');
        const p2HeavyCd = document.getElementById('p2-heavy-cd');
        if (p2LightCd) p2LightCd.style.width = `${Math.max(0, (player2.lightCooldown / characterStats[player2Character].lightAttackCooldown) * 100)}%`;
        if (p2HeavyCd) p2HeavyCd.style.width = `${Math.max(0, (player2.heavyCooldown / characterStats[player2Character].heavyAttackCooldown) * 100)}%`;

        // Continue the game loop
        requestAnimationFrame(gameLoop);
    }
}

// Initialize players
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

// Initialize and start game
initializePlayers();
gameLoop();