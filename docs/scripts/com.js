class ComputerAI {
    constructor(aiPlayer, humanPlayer, characterStats) {
        this.ai = aiPlayer;
        this.human = humanPlayer;
        this.stats = characterStats;
        this.lastActionTime = 0;
        this.decisionInterval = 100; // Make decisions every 100ms
        this.aggressiveness = 0.7; // Base aggressiveness (0-1)
        this.defensiveness = 0.6; // Base defensiveness (0-1)
        
        // Strategy state
        this.currentStrategy = 'neutral';
        this.comboInProgress = false;
        this.dodgeTimeout = null;
        this.attackTimeout = null;
        
        // Distance preferences
        this.preferredDistance = this.stats.attackRange * 0.9;
        this.maxRange = this.stats.attackRange * 1.2;
        this.dangerRange = this.stats.attackRange * 0.5;
    }

    start() {
        this.gameLoop = setInterval(() => this.update(), this.decisionInterval);
    }

    stop() {
        clearInterval(this.gameLoop);
    }

    update() {
        if (this.ai.isStunned || this.ai.isDodging) return;
        
        const now = Date.now();
        if (now - this.lastActionTime < 100) return; // Basic action throttling
        
        // Update strategy based on situation
        this.updateStrategy();
        
        // Execute current strategy
        this.executeStrategy();
        
        this.lastActionTime = now;
    }

    updateStrategy() {
        const distance = this.getDistanceToHuman();
        const aiHealthPercent = this.ai.health / this.stats.health;
        const humanHealthPercent = this.human.health / this.human.maxHealth;
        
        // Adjust aggressiveness based on health difference
        this.aggressiveness = 0.7 + (humanHealthPercent - aiHealthPercent) * 0.3;
        
        // Update current strategy
        if (aiHealthPercent < 0.3) {
            // Low health - become more defensive
            this.currentStrategy = 'defensive';
            this.defensiveness = 0.9;
        } else if (humanHealthPercent < 0.3 && aiHealthPercent > 0.5) {
            // Human low health - become aggressive
            this.currentStrategy = 'aggressive';
            this.aggressiveness = 0.9;
        } else if (this.human.isStunned || this.human.isDodging) {
            // Human vulnerable - capitalize
            this.currentStrategy = 'punish';
            this.aggressiveness = 1;
        } else if (this.ai.ultimate >= this.stats.ultimateRequired) {
            // Ultimate ready - look for opportunity
            this.currentStrategy = 'ultimate';
        } else {
            // Default neutral strategy
            this.currentStrategy = 'neutral';
        }
    }

    executeStrategy() {
        const distance = this.getDistanceToHuman();
        
        // Handle movement
        this.handleMovement(distance);
        
        // Handle combat actions based on strategy
        switch (this.currentStrategy) {
            case 'defensive':
                this.executeDefensiveStrategy(distance);
                break;
            case 'aggressive':
                this.executeAggressiveStrategy(distance);
                break;
            case 'punish':
                this.executePunishStrategy(distance);
                break;
            case 'ultimate':
                this.executeUltimateStrategy(distance);
                break;
            default:
                this.executeNeutralStrategy(distance);
        }
    }

    handleMovement(distance) {
        // Clear existing movement keys
        this.releaseMovementKeys();
        
        if (this.ai.isStunned || this.ai.isDodging) return;
        
        const targetDistance = this.currentStrategy === 'defensive' ? 
            this.maxRange : this.preferredDistance;
        
        if (Math.abs(distance - targetDistance) > 20) {
            if (distance < targetDistance) {
                // Move away
                this.ai.facing === 1 ? this.pressKey('arrowright') : this.pressKey('arrowleft');
            } else {
                // Move closer
                this.ai.facing === 1 ? this.pressKey('arrowleft') : this.pressKey('arrowright');
            }
        }
    }

    executeDefensiveStrategy(distance) {
        // High chance to dodge if human is in attack range
        if (distance <= this.human.originalAttackRange && Math.random() < 0.7) {
            this.dodge();
        }
        
        // Counter-attack if opportunity arises
        if (this.human.isStunned || this.human.isDodging) {
            if (distance <= this.stats.attackRange) {
                this.attack(Math.random() < 0.3); // 30% chance for heavy attack
            }
        }
        
        // Occasional light attack to maintain pressure
        if (Math.random() < 0.2 && distance <= this.stats.attackRange) {
            this.attack(false);
        }
    }

    executeAggressiveStrategy(distance) {
        if (distance <= this.stats.attackRange) {
            // In range - attack
            if (!this.comboInProgress) {
                this.startCombo();
            }
        } else if (distance <= this.maxRange) {
            // Close to range - approach and prepare attack
            this.approachAndAttack();
        }
        
        // Dodge if in danger
        if (distance <= this.dangerRange && Math.random() < 0.4) {
            this.dodge();
        }
    }

    executePunishStrategy(distance) {
        if (distance <= this.stats.attackRange) {
            // Prioritize heavy attacks during punish
            this.attack(Math.random() < 0.7);
        } else {
            // Get in range quickly
            this.approachAndAttack();
        }
    }

    executeUltimateStrategy(distance) {
        // Character-specific ultimate strategies
        switch (this.stats.name.toLowerCase()) {
            case 'warrior':
                // Use ultimate when close and human is not invulnerable
                if (distance <= this.stats.attackRange && !this.human.invincible) {
                    this.useUltimate();
                }
                break;
            case 'ninja':
                // Use ultimate when at medium range
                if (distance <= this.stats.ultimateDistance && distance >= this.stats.attackRange) {
                    this.useUltimate();
                }
                break;
            case 'mage':
                // Use ultimate when human is in a predictable position
                if (!this.human.isDodging && !this.human.isStunned) {
                    this.useUltimate();
                }
                break;
        }
    }

    executeNeutralStrategy(distance) {
        // Mix of offensive and defensive actions
        if (distance <= this.stats.attackRange) {
            if (Math.random() < this.aggressiveness) {
                this.attack(Math.random() < 0.3);
            } else if (Math.random() < this.defensiveness) {
                this.dodge();
            }
        }
        
        // Maintain ideal spacing
        this.handleMovement(distance);
    }

    startCombo() {
        this.comboInProgress = true;
        
        // Basic combo sequence
        const executeCombo = async () => {
            await this.attack(false); // Light attack
            await new Promise(resolve => setTimeout(resolve, 200));
            await this.attack(false); // Light attack
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.attack(true);  // Finish with heavy attack
            this.comboInProgress = false;
        };
        
        executeCombo();
    }

    approachAndAttack() {
        const distance = this.getDistanceToHuman();
        if (distance > this.stats.attackRange) {
            // Move towards human
            if (this.ai.x < this.human.x) {
                this.pressKey('arrowright');
            } else {
                this.pressKey('arrowleft');
            }
        }
        
        // Attack when in range
        if (distance <= this.stats.attackRange * 1.1) {
            this.attack(Math.random() < 0.3);
        }
    }

    // Utility methods
    getDistanceToHuman() {
        const aiCenter = this.ai.x + 30;
        const humanCenter = this.human.x + 30;
        return Math.abs(aiCenter - humanCenter);
    }

    attack(isHeavy) {
        if (isHeavy) {
            this.pressKey('p');
            setTimeout(() => this.releaseKey('p'), 100);
        } else {
            this.pressKey('o');
            setTimeout(() => this.releaseKey('o'), 100);
        }
    }

    dodge() {
        if (this.ai.dodgeCooldown <= 0) {
            this.pressKey('u');
            setTimeout(() => this.releaseKey('u'), 100);
        }
    }

    useUltimate() {
        this.pressKey('i');
        setTimeout(() => this.releaseKey('i'), 100);
    }

    // Key management
    pressKey(key) {
        window.keys[key] = true;
    }

    releaseKey(key) {
        window.keys[key] = false;
    }

    releaseMovementKeys() {
        this.releaseKey('arrowleft');
        this.releaseKey('arrowright');
    }
}

// Export the ComputerAI class
window.ComputerAI = ComputerAI;