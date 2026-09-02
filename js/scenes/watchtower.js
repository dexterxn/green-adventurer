/* =====================================================================
   The Ruined Watchtower - optional, and worth doing.

   Bring rope, climb, take the Sky Shard. The shard does not open any
   door, but it changes which ending you get if you save the tree.
   ===================================================================== */

class Watchtower extends AdventureScene {

    constructor() {
        super('watchtower', 'Ruined Watchtower');
    }

    onEnter() {
        this.addCrow();
        this.addStair();

        if (GameState.hasFlag('climbedTower') && !GameState.has('skyShard')) {
            this.revealShard(false);
        }

        this.createHero(0.20, 0.72);

        this.addExit('south', 'market', 'Market Square');
    }

    addCrow() {
        this.npc(0.82, 0.44, '🐦‍⬛', {
            size: 4,
            idleSpeed: 900,
            greeting: 'A crow on a broken windowsill. It has been here longer than the roof.',
            lines: () => {
                if (GameState.has('skyShard')) {
                    return ['The crow watches the shard, not you.', 'It does not seem angry. It seems relieved.'];
                }
                if (!GameState.has('rope')) {
                    return ['The crow looks at the stair.', 'Then at you.', 'Then, pointedly, at the empty place on your belt where a rope is not.'];
                }
                return [Phaser.Utils.Array.GetRandom([
                    'The crow makes a sound like a latch turning.',
                    'It sidesteps along the sill and waits for you to go up.',
                    'Watchmen sat here for three hundred years. Then one year they did not.'
                ])];
            }
        });
    }

    addStair() {
        this.hotspot(0.50, 0.66, '🪜 the broken stair', {
            size: 2,
            hover: () => {
                if (GameState.hasFlag('climbedTower')) return 'You have been up. The rope is still where you left it.';
                return GameState.has('rope')
                    ? 'Twenty feet of missing stair. Your rope will just about do it.'
                    : 'The stair gives out twenty feet up. You would need a rope.';
            },
            onClick: () => {
                if (!GameState.has('rope')) {
                    this.showMessage('Not without a rope. Wren sells one for thirty.');
                    return;
                }
                if (GameState.hasFlag('climbedTower')) {
                    this.showMessage('Nothing left up there but a good view and a lot of wind.');
                    return;
                }

                GameState.setFlag('climbedTower');
                this.speak(null, [
                    'You throw the rope, test it twice, and go up.',
                    'The valley from here is smaller than it feels from inside it. And greyer.',
                    'Something is sitting in the old signal-basin. It has been there a very long time.'
                ], 2400);

                if (this.hero) {
                    this.tweens.add({
                        targets: this.hero,
                        x: this.px(0.50),
                        y: this.py(0.34),
                        duration: 2400,
                        ease: 'Sine.inOut'
                    });
                }

                this.time.delayedCall(5200, () => this.revealShard(true));
            }
        });
    }

    revealShard(animate) {
        const shard = this.pickup(0.50, 0.24, 'skyShard', {
            label: '💫 Sky Shard',
            hover: 'A piece of a star that fell before the valley had a name.',
            onTake: () => this.speak(null, [
                'It is cold, and it is not heavy enough.',
                'Mira should look at this.'
            ], 2600)
        });

        if (animate) {
            shard.setAlpha(0);
            this.tweens.add({ targets: shard, alpha: 1, duration: 1200 });
        }

        this.tweens.add({
            targets: shard,
            scale: { from: 1, to: 1.12 },
            yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.inOut'
        });

        return shard;
    }
}
