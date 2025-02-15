class ComputerAI {
    constructor(player, opponent, stats) {
        this.player = player;
        this.opponent = opponent;
        this.stats = stats;
        this.decisionInterval = null;
        this.difficulty = 0.9;
        this.lastDecisionTime = Date.now();
        this.decisionDelay = 100;
        this.comboCooldown = 0;
        this.lastPosition = this.player.x;
        this.stuckCounter = 0;
        this.preferredDistance = this.calculatePreferredDistance();
        this.aggressionLevel = this.calculateAggressionLevel();
        this.currentKey = null;
        const playerCenter = this.player.x + 30;
        const opponentCenter = this.opponent.x + 30;
        this.player.facing = playerCenter < opponentCenter ? -1 : 1;
        this.player.element.style.setProperty('--facing', this.player.facing);
}

    start() {
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
        this.releaseAllKeys();
    }

    releaseAllKeys() {
        if (this.currentKey) {
            this.releaseKey(this.currentKey);
            this.currentKey = null;
        }
    }

    calculateDistance() {
        const playerCenter = this.player.x + 30;
        const opponentCenter = this.opponent.x + 30;
        return Math.abs(playerCenter - opponentCenter);
    }

    makeDecision() {
        const distance = this.calculateDistance();
        const healthRatio = this.player.health / this.stats.health;
        const opponentHealthRatio = this.opponent.health / this.opponent.maxHealth;
        
        // Stuck detection
        if (this.detectStuck()) {
            this.performDodge();
            this.stuckCounter = 0;
            return;
        }

        // Emergency actions
        if (healthRatio < 0.3 && this.shouldDodge(distance)) {
            this.performDodge();
            return;
        }

        // Ultimate check
        if (this.shouldUseUltimate(healthRatio, opponentHealthRatio)) {
            this.performUltimate();
            return;
        }

        // Position management
        this.managePosition(distance);

        // Attack if in range
        if (distance <= this.stats.attackRange * 1.1) {
            this.decideAttack(distance, healthRatio);
        }
    }

    managePosition(distance) {
        const playerCenter = this.player.x + 30;
        const opponentCenter = this.opponent.x + 30;
        let newKey = null;
        
        this.releaseAllKeys();
        
        // 更新面向 - 總是面向對手
        this.player.facing = playerCenter < opponentCenter ? -1 : 1;
        this.player.element.style.setProperty('--facing', this.player.facing);
        
        if (distance < this.preferredDistance * 0.7) {
            // 太近，後退
            newKey = playerCenter < opponentCenter ? 
                (this.player === player1 ? 'a' : 'arrowleft') : 
                (this.player === player1 ? 'd' : 'arrowright');
        } else if (distance > this.preferredDistance * 1.3) {
            // 太遠，前進
            newKey = playerCenter < opponentCenter ? 
                (this.player === player1 ? 'd' : 'arrowright') : 
                (this.player === player1 ? 'a' : 'arrowleft');
        }
    
        if (newKey && newKey !== this.currentKey) {
            this.currentKey = newKey;
            this.pressKey(this.currentKey);
        }
    }

    pressKey(key) {
        const keyDownEvent = new KeyboardEvent('keydown', { 
            key: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(keyDownEvent);
    }

    releaseKey(key) {
        const keyUpEvent = new KeyboardEvent('keyup', { 
            key: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(keyUpEvent);
    }

    // [其餘方法保持不變]
    calculatePreferredDistance() {
        switch(this.stats.name.toLowerCase()) {
            case 'warrior': return this.stats.attackRange * 0.8;
            case 'ninja': return this.stats.attackRange * 1.2;
            case 'mage': return this.stats.attackRange * 1.5;
            default: return this.stats.attackRange;
        }
    }

    calculateAggressionLevel() {
        switch(this.stats.name.toLowerCase()) {
            case 'warrior': return 0.8;
            case 'ninja': return 0.6;
            case 'mage': return 0.4;
            default: return 0.5;
        }
    }

    detectStuck() {
        const currentPosition = this.player.x;
        if (Math.abs(currentPosition - this.lastPosition) < 1) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        this.lastPosition = currentPosition;
        return this.stuckCounter > 10;
    }

    performCombo() {
        const now = Date.now();
        
        switch(this.stats.name.toLowerCase()) {
            case 'warrior':
                setTimeout(() => this.performHeavyAttack(), 0);
                setTimeout(() => this.performLightAttack(), 300);
                setTimeout(() => this.performHeavyAttack(), 600);
                break;
            case 'ninja':
                setTimeout(() => this.performLightAttack(), 0);
                setTimeout(() => this.performLightAttack(), 200);
                setTimeout(() => this.performHeavyAttack(), 400);
                break;
            case 'mage':
                setTimeout(() => this.performLightAttack(), 0);
                setTimeout(() => this.performHeavyAttack(), 400);
                break;
        }
        
        this.comboCooldown = now + 1000;
    }

    shouldDodge(distance) {
        const opponentIsAttacking = 
            this.opponent.element.classList.contains('light-attack') ||
            this.opponent.element.classList.contains('heavy-attack');
        
        return (
            this.player.dodgeCooldown <= 0 && (
                (opponentIsAttacking && distance < this.stats.attackRange * 1.2) ||
                (this.player.health / this.stats.health < 0.3 && Math.random() > 0.7) ||
                (Math.random() > 0.95)
            )
        );
    }

    shouldUseUltimate(healthRatio, opponentHealthRatio) {
        if (this.player.ultimate < this.stats.ultimateRequired) return false;

        const distance = this.calculateDistance();
        switch(this.stats.name.toLowerCase()) {
            case 'warrior':
                return distance <= this.stats.attackRange * 1.5 && opponentHealthRatio > 0.3;
            case 'ninja':
                return healthRatio < 0.4 || opponentHealthRatio < 0.4;
            case 'mage':
                return this.opponent.isStunned || opponentHealthRatio < 0.5;
            default:
                return healthRatio < 0.5 || opponentHealthRatio < 0.3;
        }
    }

    decideAttack(distance, healthRatio) {
        const now = Date.now();
        if (this.comboCooldown > now) return;

        if (this.opponent.isStunned || this.opponent.isDodging) {
            this.performHeavyAttack();
            this.comboCooldown = now + 500;
        } else if (distance <= this.stats.attackRange * 0.8) {
            if (Math.random() < 0.7) {
                this.performLightAttack();
            } else {
                this.performHeavyAttack();
            }
            this.comboCooldown = now + 300;
        } else {
            this.performLightAttack();
            this.comboCooldown = now + 200;
        }
    }

    performDodge() {
        if (this.player.dodgeCooldown <= 0) {
            this.releaseAllKeys(); // 確保在閃避前釋放所有移動鍵
            
            const dodgeEvent = new KeyboardEvent('keydown', {
                key: this.player === player1 ? 'v' : 'u',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(dodgeEvent);
        }
    }

    performLightAttack() {
        if (this.player.lightCooldown <= 0) {
            const attackEvent = new KeyboardEvent('keydown', {
                key: this.player === player1 ? 'z' : 'o',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(attackEvent);
        }
    }

    performHeavyAttack() {
        if (this.player.heavyCooldown <= 0) {
            const attackEvent = new KeyboardEvent('keydown', {
                key: this.player === player1 ? 'x' : 'p',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(attackEvent);
        }
    }

    performUltimate() {
        if (this.player.ultimate >= this.stats.ultimateRequired) {
            this.releaseAllKeys(); // 確保在釋放大招前釋放所有移動鍵
            
            const ultimateEvent = new KeyboardEvent('keydown', {
                key: this.player === player1 ? 'c' : 'i',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(ultimateEvent);
        }
    }
}

function initComputerMode() {
    const playerCharacter = localStorage.getItem('player1Character');
    const getCounterCharacter = (playerChar) => {
        switch(playerChar) {
            case 'warrior': return 'mage';    // Mage counters Warrior
            case 'mage': return 'ninja';   // Ninja counters Mage
            case 'ninja': return 'warrior'; // Warrior counters Ninja
            default: return ['warrior', 'ninja', 'mage'][Math.floor(Math.random() * 3)];
        }
    };
    
    const computerCharacter = getCounterCharacter(playerCharacter);
    localStorage.setItem('player2Character', computerCharacter);
    
    return computerCharacter;
}