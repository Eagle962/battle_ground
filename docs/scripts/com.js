// Improved Computer AI Logic for Enhanced Combat Arena

class ComputerAI {
    constructor(player, opponent, stats) {
        this.player = player;
        this.opponent = opponent;
        this.stats = stats;
        this.decisionInterval = null;
        this.difficulty = 0.8; // AI difficulty (0-1)
        this.lastDecisionTime = Date.now();
        this.decisionDelay = 500; // Adjust decision frequency
    }

    start() {
        // Start making decisions
        this.decisionInterval = setInterval(() => {
            if (!this.player.isStunned && !this.player.isDodging) {
                this.makeDecision();
            }
        }, this.decisionDelay);
    }

    stop() {
        if (this.decisionInterval) {
            clearInterval(this.decisionInterval);
        }
    }

    calculateDistance() {
        return Math.abs(this.player.x - this.opponent.x);
    }

    updateFacing() {
        // 更準確地計算面向
        const playerCenter = this.player.x + 30;
        const opponentCenter = this.opponent.x + 30;
        const newFacing = playerCenter < opponentCenter ? 1 : -1;
        
        // 只有當面向實際改變時才更新
        if (this.player.facing !== newFacing) {
            this.player.facing = newFacing;
            
            // 直接設置元素的 transform 屬性
            this.player.element.style.transform = `scaleX(${this.player.facing})`;
            
            // 同時設置 CSS 變量，以支持動畫
            this.player.element.style.setProperty('--facing', this.player.facing);
        }
    }

    makeDecision() {
        // Update facing direction first
        this.updateFacing();

        const distance = this.calculateDistance();
        const randomFactor = Math.random();

        // Advanced evasion
        if (this.shouldDodge(distance)) {
            this.performDodge();
            return;
        }

        // Ultimate strategy
        if (this.shouldUseUltimate()) {
            this.performUltimate();
            return;
        }

        // Attack strategy based on distance and character type
        if (distance <= this.stats.attackRange) {
            // Close combat strategy
            if (randomFactor > 0.5) {
                this.performHeavyAttack();
            } else {
                this.performLightAttack();
            }
        } else {
            // Movement strategy
            this.moveTowardsOpponent();
        }
    }

    shouldDodge(distance) {
        // More intelligent dodging
        return (
            // Dodge when close to opponent
            (distance < this.stats.attackRange * 1.2 && 
                this.player.dodgeCooldown <= 0) && 
            (
                // Low health priority dodge
                (this.player.health / this.stats.health < 0.4) || 
                // Random dodge with increasing chance when health is low
                (this.player.health / this.stats.health < 0.7 && Math.random() > 0.7) ||
                // Random dodge
                (Math.random() > 0.9)
            )
        );
    }

    shouldUseUltimate() {
        return (
            this.player.ultimate >= this.stats.ultimateRequired && (
                // Use ultimate when health is low
                (this.player.health / this.stats.health < 0.5) || 
                // Use ultimate with some randomness
                (Math.random() > 0.8)
            )
        );
    }

    performDodge() {
        // Dodge in the optimal direction
        const dodgeDirection = this.player.x < this.opponent.x ? -1 : 1;
        
        // Simulate dodge key press
        const dodgeEvent = new KeyboardEvent('keydown', { 
            key: this.player === player1 ? 'v' : 'u' 
        });
        document.dispatchEvent(dodgeEvent);
    }

    performLightAttack() {
        if (this.player.lightCooldown <= 0) {
            // Simulate light attack key press
            const attackEvent = new KeyboardEvent('keydown', { 
                key: this.player === player1 ? 'z' : 'o' 
            });
            document.dispatchEvent(attackEvent);
        }
    }

    performHeavyAttack() {
        if (this.player.heavyCooldown <= 0) {
            // Simulate heavy attack key press
            const attackEvent = new KeyboardEvent('keydown', { 
                key: this.player === player1 ? 'x' : 'p' 
            });
            document.dispatchEvent(attackEvent);
        }
    }

    performUltimate() {
        if (this.player.ultimate >= this.stats.ultimateRequired) {
            // Simulate ultimate key press
            const ultimateEvent = new KeyboardEvent('keydown', { 
                key: this.player === player1 ? 'c' : 'i' 
            });
            document.dispatchEvent(ultimateEvent);
        }
    }

    moveTowardsOpponent() {
        // More intelligent movement
        const moveEvent = new KeyboardEvent('keydown', { 
            key: this.player.x < this.opponent.x ? 
                (this.player === player1 ? 'd' : 'arrowright') : 
                (this.player === player1 ? 'a' : 'arrowleft') 
        });
        document.dispatchEvent(moveEvent);
    }
}

// Function to initialize computer mode
function initComputerMode() {
    const playerCharacter = localStorage.getItem('player1Character');
    const availableCharacters = ['warrior', 'ninja', 'mage'].filter(char => char !== playerCharacter);
    const computerCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    
    localStorage.setItem('player2Character', computerCharacter);
    
    return computerCharacter;
}