/* =====================================================================
   The five endings.

   They all share EndingScene, which handles the fade, the reveal and the
   click back to the title. To add a sixth, subclass EndingScene, give it
   a background in ROOM_ART, and register it in main.js.
   ===================================================================== */

class EndingScene extends Phaser.Scene {

    constructor(key, title, lines, accent = '#cfe8b0') {
        super(key);
        this.endingTitle = title;
        this.endingLines = lines;
        this.accent = accent;
    }

    create() {
        this.w = this.game.config.width;
        this.h = this.game.config.height;
        this.s = this.w * 0.01;

        // Endings survive a reset - they are the trophy shelf on the title screen.
        GameState.endingsSeen[this.scene.key] = true;
        GameState.save();

        this.cameras.main.setBackgroundColor('#0d120c');
        this.cameras.main.fadeIn(1600, 0, 0, 0);
        paintRoom(this, this.scene.key, 1);

        const heading = this.add.text(this.w * 0.5, this.h * 0.16, this.endingTitle)
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${5.5 * this.s}px`, color: this.accent })
            .setStroke('#0a1108', 14)
            .setAlpha(0);
        this.tweens.add({ targets: heading, alpha: 1, duration: 1800 });

        this.endingLines.forEach((line, i) => {
            const text = this.add.text(this.w * 0.5, this.h * 0.30 + i * this.s * 4.4, line)
                .setOrigin(0.5)
                .setStyle({ fontFamily: FONT, fontSize: `${2.2 * this.s}px`, color: '#e4ebd8' })
                .setStroke('#0a1108', 8)
                .setWordWrapWidth(this.w * 0.8)
                .setAlpha(0);
            this.time.delayedCall(1400 + i * 1700, () => {
                this.tweens.add({ targets: text, alpha: 1, y: text.y - this.s, duration: 1000, ease: 'Cubic.out' });
            });
        });

        const readyAt = 1400 + this.endingLines.length * 1700 + 800;
        this.time.delayedCall(readyAt, () => {
            const prompt = this.add.text(this.w * 0.5, this.h * 0.90, 'Click anywhere to return to the title.')
                .setOrigin(0.5)
                .setStyle({ fontFamily: FONT, fontSize: `${1.8 * this.s}px`, color: '#9fb489' })
                .setStroke('#0a1108', 6)
                .setAlpha(0);
            this.tweens.add({ targets: prompt, alpha: 1, duration: 900 });

            this.input.on('pointerdown', () => {
                this.cameras.main.fade(1000, 0, 0, 0);
                this.time.delayedCall(1000, () => this.scene.start('intro'));
            });
        });
    }
}


/* ---------------------------------------------------------------------
   THE BLOOM - the straightforward good ending.
   Seed + Elixir, no Sky Shard.
   --------------------------------------------------------------------- */
class EndingBloom extends EndingScene {
    constructor() {
        super('endingBloom', 'THE BLOOM', [
            'It takes four days. You sleep at the root and Pip brings you food you do not eat.',
            'On the fourth morning the grey is gone from the lower branches, and it keeps going.',
            'The Heartwood is not what it was. It is younger, and slightly the wrong shape, and alive.',
            'Elder Maple walks out to the grove to see it and does not say anything at all for an hour.',
            'You stay through the summer. Somebody has to teach Pip which end of a seed goes down.'
        ], '#a8e08a');
    }
}

/* ---------------------------------------------------------------------
   THE GREEN STAR - the good ending, with the Sky Shard in your bag.
   --------------------------------------------------------------------- */
class EndingGreenStar extends EndingScene {
    constructor() {
        super('endingGreenStar', 'THE GREEN STAR', [
            'The shard goes cold in your pocket the moment the seed takes, and then it goes out.',
            'What grows is not quite a tree. It is the right shape, and it is green, and it is faintly lit.',
            'Ships downriver start using it to steer by. Nobody in Willowbrook thinks this is strange.',
            'Mira says the shard was waiting for something to grow into. She says it politely, like a diagnosis.',
            'The valley comes back green, and at night it is never entirely dark again.'
        ], '#9fffcf');
    }
}

/* ---------------------------------------------------------------------
   THE GILDED ROAD - you sold the seed to Rilla.
   --------------------------------------------------------------------- */
class EndingGilded extends EndingScene {
    constructor() {
        super('endingGilded', 'THE GILDED ROAD', [
            'Rilla counts it out honestly, which is the worst part. Five hundred, every coin.',
            'You are three days downriver before you stop being able to hear the valley.',
            'You are rich. You are extremely, uncomplicatedly rich, in a city that has never seen a Heartwood.',
            'Willowbrook holds on for another eleven years. Elder Maple does not live to see the end of it.',
            'Somewhere in a vault, a seed that used to beat is very quiet.'
        ], '#ffd97a');
    }
}

/* ---------------------------------------------------------------------
   THE QUIET GRAFTING - you planted the seed on your own farm.
   --------------------------------------------------------------------- */
class EndingGrafting extends EndingScene {
    constructor() {
        super('endingGrafting', 'THE QUIET GRAFTING', [
            'You put it in your own ground, behind the stump, where the soil is good and nobody is watching.',
            'It comes up fast. By autumn there is a green thing in the Verdant Plot the height of a barn.',
            'The Heartwood in the grove goes on greying. It takes six years, and then it stops being a tree.',
            'But the valley is not empty. There is a green place in it, and it is yours, and people walk out to see it.',
            'Tussock says you saved something. He is careful never to say what.'
        ], '#8fd0a0');
    }
}

/* ---------------------------------------------------------------------
   THE WITHERING - the Wraith took you, or you gave up at the trunk.
   --------------------------------------------------------------------- */
class EndingWithering extends EndingScene {
    constructor() {
        super('endingWithering', 'THE WITHERING', [
            'It is not painful. That is not the sort of thing the Grey is.',
            'It is the feeling of putting something down that you had been carrying for a long time.',
            'Colour goes first. Then hurry. Then the idea that anything in particular needs doing.',
            'Sister Bell keeps the candle lit for you too. She has plenty of practice.',
            'The valley waits for somebody else. It is very good at waiting.'
        ], '#a8a89c');
    }
}
