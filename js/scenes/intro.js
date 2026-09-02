/* =====================================================================
   The title screen.

   This one is a plain Phaser.Scene rather than an AdventureScene, because
   it has no sidebar, no inventory and no exits - just a menu.
   ===================================================================== */

class Intro extends Phaser.Scene {

    constructor() {
        super('intro');
    }

    create() {
        this.w = this.game.config.width;
        this.h = this.game.config.height;
        this.s = this.w * 0.01;

        this.cameras.main.setBackgroundColor('#0d120c');
        this.cameras.main.fadeIn(900, 0, 0, 0);
        paintRoom(this, 'title', 1);

        this.add.text(this.w * 0.5, this.h * 0.22, 'GREEN ADVENTURER')
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${7 * this.s}px`, color: '#bfe89a' })
            .setStroke('#0a1108', 14);

        this.add.text(this.w * 0.5, this.h * 0.32, 'The valley of Willowbrook is going grey.')
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${2.4 * this.s}px`, color: '#dfe8cf' })
            .setStroke('#0a1108', 8);

        const prologue = [
            'The Heartwood at the centre of the valley has taken a blight the old',
            'people call the Grey. Where it spreads, colour leaves first, then everything else.',
            '',
            'You are the last of a small order of wandering gardeners.',
            'You have a pair of boots, an empty purse, and an opinion about dying trees.'
        ];
        prologue.forEach((line, i) => {
            this.add.text(this.w * 0.5, this.h * 0.42 + i * this.s * 2.9, line)
                .setOrigin(0.5)
                .setStyle({ fontFamily: FONT, fontSize: `${1.8 * this.s}px`, color: '#b8c6a8' })
                .setStroke('#0a1108', 6);
        });

        let y = this.h * 0.68;

        if (GameState.hasSave()) {
            this.menuOption(y, '▸  Continue your journey', () => {
                GameState.load();
                this.begin('village');
            });
            y += this.h * 0.08;
        }

        this.menuOption(y, '▸  Begin a new journey', () => {
            GameState.reset();
            this.begin('village');
        });

        // A quiet trophy shelf. Endings survive a reset.
        const found = Object.keys(GameState.endingsSeen || {}).length;
        if (found > 0) {
            this.add.text(this.w * 0.5, this.h * 0.92, `Endings found: ${found} of 5`)
                .setOrigin(0.5)
                .setStyle({ fontFamily: FONT, fontSize: `${1.6 * this.s}px`, color: '#8fae74' })
                .setStroke('#0a1108', 6);
        }
    }

    menuOption(y, label, action) {
        const text = this.add.text(this.w * 0.5, y, label)
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${3 * this.s}px`, color: '#e8f0d8' })
            .setStroke('#0a1108', 10)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                text.setColor('#ffe08a');
                this.tweens.add({ targets: text, scale: 1.06, duration: 140 });
            })
            .on('pointerout', () => {
                text.setColor('#e8f0d8');
                this.tweens.add({ targets: text, scale: 1, duration: 140 });
            })
            .on('pointerdown', action);
        return text;
    }

    begin(sceneKey) {
        this.cameras.main.fade(800, 0, 0, 0);
        this.time.delayedCall(800, () => this.scene.start(sceneKey));
    }
}
