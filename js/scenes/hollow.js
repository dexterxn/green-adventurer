/* =====================================================================
   The Sunken Hollow - a chapel that went under the roots.

   This is the one room that can kill you. The reliquary holds the
   Heartseed; opening it wakes the Grey Wraith. Silver survives that.
   Nothing else does.
   ===================================================================== */

class Hollow extends AdventureScene {

    constructor() {
        super('hollow', 'The Sunken Hollow');
    }

    onEnter() {
        GameState.setFlag('enteredHollow');

        this.addSisterBell();
        this.addReliquary();
        this.addGraves();

        this.createHero(0.22, 0.68);

        this.addExit('north', 'woods', 'Whispering Woods');

        if (!GameState.hasFlag('tookHeartseed')) {
            this.showMessage('Your lantern reaches about four feet. The room is considerably larger than that.');
        }
    }

    addSisterBell() {
        this.npc(0.74, 0.58, '👻', {
            size: 6,
            idleSpeed: 2600,
            greeting: 'Sister Bell. She has been dead two hundred years and is still tidying.',
            lines: () => {
                if (GameState.hasFlag('tookHeartseed')) {
                    return [
                        '"You have it. Go, then, and go quickly."',
                        '"I would come up with you, but somebody has to stay and keep the door shut."'
                    ];
                }
                if (!GameState.hasFlag('metBell')) {
                    GameState.setFlag('metBell');
                    return [
                        '"Oh. A living one. It has been a while."',
                        '"The tree gave us its seed for keeping, before the Grey came. It is in the reliquary, behind me."',
                        '"The Grey keeps house here now. It will come the moment the lid moves."',
                        '"Silver. You need silver on you. It cannot hold what silver has touched."',
                        GameState.has('silverCharm')
                            ? '"You have some. Good. Then open it, and do not flinch."'
                            : '"You have none. Then go back up and buy some, child, and do not argue with me about it."'
                    ];
                }
                return GameState.has('silverCharm')
                    ? ['"You are carrying silver. Open the reliquary."', '"It will hurt. It will not keep you."']
                    : ['"No silver. No."', '"Wren keeps a charm under her counter. One hundred and fifty gold. Go."'];
            }
        });
    }

    addReliquary() {
        const reliquary = this.hotspot(0.46, 0.70, '⚱️ the reliquary', {
            size: 2.2,
            hover: () => {
                if (GameState.hasFlag('tookHeartseed')) return 'Empty, and finally quiet.';
                return GameState.has('silverCharm')
                    ? 'The lid is not heavy. The silver at your belt is already cold.'
                    : 'The lid is not heavy. Everything else about this is.';
            },
            onClick: () => this.openReliquary(reliquary)
        });

        this.tweens.add({
            targets: reliquary,
            alpha: { from: 1, to: 0.7 },
            yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.inOut'
        });

        return reliquary;
    }

    openReliquary(reliquary) {
        if (GameState.hasFlag('tookHeartseed')) {
            this.showMessage('You already have what was in it.');
            return;
        }

        // One deliberate warning before anything irreversible happens.
        if (!this.lidArmed) {
            this.lidArmed = true;
            this.showMessage(GameState.has('silverCharm')
                ? 'Sister Bell steps back. "Now. And do not flinch." Click again to lift the lid.'
                : 'You have no silver. Sister Bell is saying something and you are not listening. Click again to lift the lid.');
            this.time.delayedCall(7000, () => this.lidArmed = false);
            return;
        }

        this.lidArmed = false;
        this.summonWraith(reliquary);
    }

    summonWraith(reliquary) {
        const hasSilver = GameState.has('silverCharm');

        const wraith = this.hotspot(0.46, 0.34, '👤', {
            size: 9,
            color: '#b8c4bc',
            depth: 20
        });
        wraith.setAlpha(0).disableInteractive();

        this.tweens.add({ targets: wraith, alpha: 0.9, duration: 1800 });
        this.tweens.add({
            targets: wraith,
            y: wraith.y + this.py(0.05),
            yoyo: true, repeat: -1, duration: 2600, ease: 'Sine.inOut'
        });
        this.cameras.main.shake(1400, 0.004);

        this.tweens.add({
            targets: reliquary,
            alpha: 0.2, duration: 1200
        });

        if (hasSilver) {
            this.speak(null, [
                'You lift the lid. The cold comes up out of it like water out of a broken main.',
                'Something that was in the walls decides to be here instead.',
                'It reaches through you. The charm at your belt goes white hot, and then it cracks.',
                'The Grey lets go. It looks at the pieces of the silver, and at you, and it withdraws into the roof.',
                'Sister Bell has not moved. "Take it," she says. "Take it and go."'
            ], 2800);

            this.time.delayedCall(2600, () => {
                GameState.remove('silverCharm');
                this.updateInventory();
                this.floatText(0.30, 0.60, '🧿 shattered', '#e79a9a');
            });

            this.time.delayedCall(14000, () => {
                GameState.add('heartseed');
                GameState.setFlag('tookHeartseed');
                this.updateInventory();
                this.floatText(0.46, 0.60, '+🌰', '#c8f09a');
                this.showMessage('The Heartseed is warm, and it is beating, very slowly.');
                this.tweens.add({ targets: wraith, alpha: 0, duration: 2000, onComplete: () => wraith.destroy() });
            });

        } else {
            this.speak(null, [
                'You lift the lid.',
                'Something that was in the walls decides to be here instead, and there is no silver on you at all.'
            ], 2600);

            this.time.delayedCall(5600, () => this.gotoScene('endingWithering'));
        }
    }

    addGraves() {
        this.hotspot(0.16, 0.44, '🕯️', {
            size: 3,
            hover: 'A candle that somebody has kept lit for two hundred years.',
            onClick: () => this.showMessage(Phaser.Utils.Array.GetRandom([
                'The flame does not move when you breathe on it.',
                'There is fresh wax. There is no one here to have brought it.',
                'Sister Bell trims it without looking, the way you would straighten a picture.'
            ]))
        });

        this.hotspot(0.88, 0.80, '🪦', {
            size: 3,
            hover: 'Names worn down to nothing but their spacing.',
            onClick: () => this.showMessage('Eleven names. The twelfth space was left blank on purpose.')
        });
    }
}
