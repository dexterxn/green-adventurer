/* =====================================================================
   The Glimmerdeep - the second way to make money.

   Five seams. Work one and it is spent for a while, so you rotate around
   them. Like the farm, the cooldown is stored as a timestamp, which means
   the seams refill while you are off doing something else.

   Balance: VEIN_COOLDOWN_MS, ORE_MIN/ORE_MAX, and GEM_CHANCE below.
   ===================================================================== */

const VEIN_COOLDOWN_MS = 15000;
const ORE_MIN = 4;
const ORE_MAX = 9;
const GEM_CHANCE = 0.12;

/* Where the seams sit on the cave wall. Add a pair to add a seam -
   GameState tops up the veins array to match. */
const VEIN_SPOTS = [
    { x: 0.12, y: 0.32 },
    { x: 0.28, y: 0.56 },
    { x: 0.45, y: 0.30 },
    { x: 0.60, y: 0.58 },
    { x: 0.70, y: 0.34 }
];

class Mine extends AdventureScene {

    constructor() {
        super('mine', 'The Glimmerdeep');
    }

    onEnter() {
        this.veinSprites = [];

        while (GameState.veins.length < VEIN_SPOTS.length) {
            GameState.veins.push({ minedAt: 0 });
        }

        this.addVeins();
        this.addSinging();

        this.createHero(0.40, 0.74);

        this.addExit('north', 'ridge', 'Stony Ridge');

        this.time.addEvent({ delay: 250, loop: true, callback: () => this.refreshVeins() });

        if (!GameState.hasFlag('minedOre')) {
            this.showMessage('Five seams. Work one, let it rest, move along the wall.');
        }
    }

    addVeins() {
        VEIN_SPOTS.forEach((spot, i) => {
            const sprite = this.hotspot(spot.x, spot.y, '', {
                size: 2.4,
                onHover: () => this.showMessage(this.veinHint(i)),
                onClick: () => this.mineVein(i)
            });
            sprite.veinIndex = i;
            sprite.homeX = spot.x;
            sprite.homeY = spot.y;
            this.veinSprites.push(sprite);
        });
        this.refreshVeins();
    }

    ready(i) {
        const vein = GameState.veins[i];
        return !vein || Date.now() - vein.minedAt >= VEIN_COOLDOWN_MS;
    }

    secondsLeft(i) {
        return Math.ceil((VEIN_COOLDOWN_MS - (Date.now() - GameState.veins[i].minedAt)) / 1000);
    }

    refreshVeins() {
        if (!this.veinSprites) return;
        this.veinSprites.forEach(sprite => {
            const i = sprite.veinIndex;
            if (this.ready(i)) {
                sprite.setText('💎\nseam').setColor('#9fe8ff');
            } else {
                sprite.setText(`🪨\n${this.secondsLeft(i)}s`).setColor('#7a736a');
            }
        });
    }

    veinHint(i) {
        if (!GameState.has('pickaxe')) return 'A bright seam in the rock. You have nothing to hit it with.';
        return this.ready(i)
            ? 'A seam worth working. Click it.'
            : 'Worked out for the moment. It will come back.';
    }

    mineVein(i) {
        if (!GameState.has('pickaxe')) {
            this.showMessage('Your hands are not a pickaxe. Bram was quite clear about this.');
            return;
        }
        if (!this.ready(i)) {
            this.showMessage(`Spent. Another ${this.secondsLeft(i)} seconds.`);
            return;
        }

        const sprite = this.veinSprites[i];
        GameState.veins[i].minedAt = Date.now();
        GameState.setFlag('minedOre');

        const ore = Math.round(Phaser.Math.Between(ORE_MIN, ORE_MAX) * GameState.oreMultiplier());
        this.gainGold(ore, sprite.homeX, sprite.homeY - 0.05);

        if (Math.random() < GEM_CHANCE) {
            GameState.add('gemstone');
            this.updateInventory();
            this.time.delayedCall(400, () => {
                this.floatText(sprite.homeX, sprite.homeY - 0.10, '+💎', '#9fe8ff');
                this.showMessage('A gemstone comes away clean. Wren pays 25 for these.');
            });
        } else {
            this.showMessage(`${ore} gold of ore.`);
        }

        this.tweens.add({
            targets: sprite,
            x: { from: sprite.x - this.s, to: sprite.x + this.s },
            yoyo: true, repeat: 2, duration: 55,
            onComplete: () => sprite.setX(this.px(sprite.homeX))
        });

        GameState.save();
        this.refreshVeins();
    }

    /* Bram's singing. It is the rock settling. Obviously. */
    addSinging() {
        this.hotspot(0.86, 0.66, '🕳️', {
            size: 3,
            hover: 'A side shaft, boarded over a long time ago.',
            onClick: () => this.showMessage(Phaser.Utils.Array.GetRandom([
                'Something on the other side of the boards stops when you stop moving.',
                'You put your ear to the wood. Three notes, very far down, in no key you know.',
                'The boards are nailed from this side. Somebody wanted it shut, not opened.'
            ]))
        });
    }
}
