/* =====================================================================
   Heartwood Grove - where the game ends, one way or another.

   Three of the five endings are reachable from this room. The other two
   are the fox's offer in the woods and the stump on your own farm.
   ===================================================================== */

class Grove extends AdventureScene {

    constructor() {
        super('grove', 'Heartwood Grove');
    }

    onEnter() {
        this.addHeartwood();
        this.addRoots();
        this.addMarker();

        this.createHero(0.16, 0.68);

        this.addExit('west', 'woods', 'Whispering Woods');

        if (!GameState.hasFlag('sawHeartwood')) {
            GameState.setFlag('sawHeartwood');
            this.speak(null, [
                'It is bigger than the village.',
                'Every leaf is still on it. Every leaf is the colour of an old newspaper.',
                'It is not dead. That is the part nobody in Willowbrook says out loud.'
            ], 3200);
        }
    }

    addHeartwood() {
        const readyToHeal = GameState.has('heartseed') && GameState.has('sunlightElixir');

        const tree = this.hotspot(0.50, 0.52, readyToHeal ? '🌳' : '🌲', {
            size: 12,
            color: '#8f8d7e',
            depth: 6,
            hover: () => {
                if (readyToHeal) return 'You have the seed and you have the light. Click the trunk.';
                if (GameState.has('heartseed')) return 'You have the seed. You have nothing to wake it with.';
                if (GameState.has('sunlightElixir')) return 'You have the light. There is nothing here left to pour it on.';
                return 'The bark is warm, and putting your hand on it feels like a decision.';
            },
            onClick: () => this.touchTrunk(tree)
        });

        this.tweens.add({
            targets: tree,
            alpha: { from: 1, to: 0.86 },
            yoyo: true, repeat: -1, duration: 3600, ease: 'Sine.inOut'
        });

        return tree;
    }

    touchTrunk(tree) {
        const readyToHeal = GameState.has('heartseed') && GameState.has('sunlightElixir');

        if (readyToHeal) {
            this.heal(tree);
            return;
        }

        // No seed, no elixir: you can still choose to stop. Deliberately.
        if (!this.surrenderArmed) {
            this.surrenderArmed = true;
            this.showMessage(GameState.has('heartseed') || GameState.has('sunlightElixir')
                ? 'You are missing half of what this needs. Putting your hand on the trunk now would just be giving up. Click again if that is what you want.'
                : 'You could put your hand flat on the bark and let it have you. People have. Click again if that is what you want.');
            this.time.delayedCall(7000, () => this.surrenderArmed = false);
            return;
        }

        this.surrenderArmed = false;
        this.speak(null, ['You put your hand on the trunk.', 'The Grey is very gentle about it.'], 2600);
        this.time.delayedCall(5200, () => this.gotoScene('endingWithering'));
    }

    heal(tree) {
        if (!this.healArmed) {
            this.healArmed = true;
            this.showMessage('Plant the Heartseed at the root and pour the Elixir over it. This ends things. Click again.');
            this.time.delayedCall(8000, () => this.healArmed = false);
            return;
        }

        GameState.remove('heartseed');
        GameState.remove('sunlightElixir');
        this.updateInventory();

        this.speak(null, [
            'You dig with your hands, which is the correct way, and set the seed against the root.',
            'The Elixir goes in slowly. It smells like cut grass and a hot afternoon.',
            'For a long moment nothing at all happens.',
            'Then, somewhere above you, one leaf turns green.'
        ], 3000);

        this.tweens.add({
            targets: tree,
            scale: { from: 1, to: 1.15 },
            duration: 5000,
            ease: 'Sine.inOut'
        });
        this.cameras.main.flash(2000, 180, 220, 150, false);

        // The Sky Shard changes what the tree comes back as.
        const ending = GameState.has('skyShard') ? 'endingGreenStar' : 'endingBloom';
        this.time.delayedCall(13000, () => this.gotoScene(ending));
    }

    addRoots() {
        this.hotspot(0.26, 0.86, '🪵 the root shelf', {
            size: 1.8,
            hover: 'A root the size of a wall, half out of the ground.',
            onClick: () => this.showMessage(Phaser.Utils.Array.GetRandom([
                'The grey has gone into the wood itself. It is not on the tree. It is the tree now.',
                'Somebody has left cut flowers here. They have gone grey too.',
                'You can feel a pulse through the root. Very slow. Slower than last week, probably.'
            ]))
        });
    }

    addMarker() {
        this.hotspot(0.80, 0.84, '🪧', {
            size: 2.6,
            hover: 'A board hammered into the ground at the edge of the grove.',
            onClick: () => this.speak(null, [
                'The board reads: THE HEARTWOOD. PLANTED BY NOBODY. OLDER THAN THE ROAD.',
                'Underneath, in newer paint: PLEASE DO NOT GIVE UP ON IT.'
            ], 3200)
        });
    }
}
