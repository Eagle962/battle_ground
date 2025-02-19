class ComputerAI {
    constructor(player, opponent, stats) {
        this.player = player;
        this.opponent = opponent;
        this.stats = stats;
        this.decisionInterval = null;
        this.difficulty = 2.0;
        this.lastDecisionTime = Date.now();
        this.decisionDelay = 5;
        this.comboCooldown = 0;
        this.lastPosition = this.player.x;
        this.stuckCounter = 0;
        this.preferredDistance = this.calculatePreferredDistance();
        this.aggressionLevel = 2;
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
        // Get the actual DOM element positions
        const playerRect = this.player.element.getBoundingClientRect();
        const opponentRect = this.opponent.element.getBoundingClientRect();
        
        // Calculate centers using the actual screen positions
        const playerCenter = playerRect.left + (playerRect.width / 2);
        const opponentCenter = opponentRect.left + (opponentRect.width / 2);
        const distance = Math.abs(playerCenter - opponentCenter);
        
        console.log('Distance calculation (DOM):', {
            playerRect,
            opponentRect,
            playerCenter,
            opponentCenter,
            distance,
            attackRange: this.stats.attackRange
        });
        
        return distance;
    }

    isInAttackRange() {
        // Use the new DOM-based distance calculation
        const distance = this.calculateDistance();
        const maxRange = this.stats.attackRange * 0.6;
        
        console.log('Range Check (DOM):', {
            distance,
            maxRange,
            inRange: distance <= maxRange
        });
        
        return distance <= maxRange;
    }

    makeDecision() {
        if (!this.isInAttackRange()) {
            // If not in range, only focus on movement
            this.managePosition(this.calculateDistance());
            return;
        }

        const healthRatio = this.player.health / this.stats.health;
        const opponentHealthRatio = this.opponent.health / this.opponent.maxHealth;

        // Only proceed with attacks if in range
        if (this.isInAttackRange()) {
            if (this.shouldDodge(this.calculateDistance())) {
                this.performDodge();
                return;
            }

            if (this.player.ultimate >= this.stats.ultimateRequired && 
                this.shouldUseUltimate(healthRatio, opponentHealthRatio)) {
                this.performUltimate();
                return;
            }

            this.performOptimalCombo();
        }
    }

    managePosition(distance) {
        // Get actual screen positions
        const playerRect = this.player.element.getBoundingClientRect();
        const opponentRect = this.opponent.element.getBoundingClientRect();
        
        const playerCenter = playerRect.left + (playerRect.width / 2);
        const opponentCenter = opponentRect.left + (opponentRect.width / 2);
        let newKey = null;
        
        // Release current movement key
        if (this.currentKey) {
            this.releaseKey(this.currentKey);
            this.currentKey = null;
        }
        
        // Update facing based on actual positions
        this.player.facing = playerCenter < opponentCenter ? 1 : -1;
        this.player.element.style.setProperty('--facing', this.player.facing);
        
        // Get much closer before attacking
        const optimalRange = this.stats.attackRange * 0.4;
        
        if (distance > optimalRange) {
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
        console.log('AI pressing key:', key);
        
        // Update the global keys object
        keys[key.toLowerCase()] = true;
        
        // Create a more detailed keyboard event
        const keyEvent = new KeyboardEvent('keydown', {
            key: key.toLowerCase(),
            code: key === 'o' ? 'KeyO' : key === 'p' ? 'KeyP' : `Key${key.toUpperCase()}`,
            keyCode: key === 'o' ? 79 : key === 'p' ? 80 : key.toUpperCase().charCodeAt(0),
            which: key === 'o' ? 79 : key === 'p' ? 80 : key.toUpperCase().charCodeAt(0),
            bubbles: true,
            cancelable: true,
            composed: true,
            repeat: false
        });
        
        // Dispatch the event to both document and window
        document.dispatchEvent(keyEvent);
        window.dispatchEvent(keyEvent);
    }

    releaseKey(key) {
        console.log('AI releasing key:', key);
        
        // Update the global keys object
        keys[key.toLowerCase()] = false;
        
        // Create a more detailed keyboard event
        const keyEvent = new KeyboardEvent('keyup', {
            key: key.toLowerCase(),
            code: key === 'o' ? 'KeyO' : key === 'p' ? 'KeyP' : `Key${key.toUpperCase()}`,
            keyCode: key === 'o' ? 79 : key === 'p' ? 80 : key.toUpperCase().charCodeAt(0),
            which: key === 'o' ? 79 : key === 'p' ? 80 : key.toUpperCase().charCodeAt(0),
            bubbles: true,
            cancelable: true,
            composed: true,
            repeat: false
        });
        
        // Dispatch the event to both document and window
        document.dispatchEvent(keyEvent);
        window.dispatchEvent(keyEvent);
    }

    calculatePreferredDistance() {
        // Stay much closer for guaranteed hits
        return this.stats.attackRange * 0.4;
    }

    calculateAggressionLevel() {
        // Maximum aggression for all characters
        return 0.95;
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

    performOptimalCombo() {
        const now = Date.now();
        if (this.comboCooldown > now) return;

        // Only perform combo if in range
        if (!this.isInAttackRange()) {
            console.log('Combo cancelled - out of range');
            return;
        }

        console.log('Performing combo - in range');
        
        switch(this.stats.name.toLowerCase()) {
            case 'warrior':
                this.performHeavyAttack();
                if (this.isInAttackRange()) {
                    setTimeout(() => {
                        if (this.isInAttackRange()) this.performLightAttack();
                    }, 200);
                    setTimeout(() => {
                        if (this.isInAttackRange()) this.performHeavyAttack();
                    }, 400);
                }
                break;
                
            case 'ninja':
                this.performLightAttack();
                if (this.isInAttackRange()) {
                    setTimeout(() => {
                        if (this.isInAttackRange()) this.performLightAttack();
                    }, 150);
                    setTimeout(() => {
                        if (this.isInAttackRange()) this.performHeavyAttack();
                    }, 300);
                }
                break;
                
            case 'mage':
                this.performLightAttack();
                if (this.isInAttackRange()) {
                    setTimeout(() => {
                        if (this.isInAttackRange()) this.performHeavyAttack();
                    }, 250);
                }
                break;
        }
        
        this.comboCooldown = now + 500;
    }

    shouldDodge(distance) {
        const opponentIsAttacking = 
            this.opponent.element.classList.contains('light-attack') ||
            this.opponent.element.classList.contains('heavy-attack');
        
        // Perfect dodge timing
        return (
            this.player.dodgeCooldown <= 0 && (
                (opponentIsAttacking && distance < this.stats.attackRange * 1.5) ||
                (this.player.health / this.stats.health < 0.5) ||
                (Math.random() > 0.8) // Random dodges to be unpredictable
            )
        );
    }

    shouldUseUltimate(healthRatio, opponentHealthRatio) {
        if (this.player.ultimate < this.stats.ultimateRequired) {
            return false;
        }

        const distance = this.calculateDistance();
        
        // Use ultimate in these conditions:
        return (
            distance <= this.stats.attackRange * 1.2 || // When close enough
            healthRatio < 0.5 || // When low health
            opponentHealthRatio > 0.7 || // When opponent is healthy
            this.opponent.isStunned || // When opponent is vulnerable
            Math.random() < 0.3 // Random chance for unpredictability
        );
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
        if (!this.isInAttackRange() || this.player.lightCooldown > 0) return;
        
        console.log('Performing light attack - in range');
        const key = this.player === player1 ? 'z' : 'o';
        this.pressKey(key);
        setTimeout(() => this.releaseKey(key), 100);
    }

    performHeavyAttack() {
        if (!this.isInAttackRange() || this.player.heavyCooldown > 0) return;
        
        console.log('Performing heavy attack - in range');
        const key = this.player === player1 ? 'x' : 'p';
        this.pressKey(key);
        setTimeout(() => this.releaseKey(key), 150);
    }

    performUltimate() {
        if (this.player.ultimate >= this.stats.ultimateRequired) {
            console.log('AI performing ultimate attack!');
            
            // Press the ultimate key
            const ultimateKey = this.player === player1 ? 'c' : 'i';
            console.log('Pressing ultimate key:', ultimateKey);
            
            // Quick press and release
            this.pressKey(ultimateKey);
            setTimeout(() => this.releaseKey(ultimateKey), 100); // Reduced to 100ms
            
            // Continue with movement after a short delay
            setTimeout(() => {
                if (this.currentKey) {
                    this.pressKey(this.currentKey);
                }
            }, 150);
        }
    }

    checkUltimateStatus() {
        console.log('Ultimate Status:', {
            currentUltimate: this.player.ultimate,
            requiredUltimate: this.stats.ultimateRequired,
            characterName: this.stats.name,
            canUseUltimate: this.player.ultimate >= this.stats.ultimateRequired
        });
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