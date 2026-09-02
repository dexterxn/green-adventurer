/* =====================================================================
   Stony Ridge - the way down to the Glimmerdeep.

   Mostly a gate: Bram will not let you past without a pickaxe, and he is
   right not to.
   ===================================================================== */

class Ridge extends AdventureScene {

    constructor() {
        super('ridge', 'Stony Ridge');
    }

    onEnter() {
        this.addBram();
        this.addScree();

        this.createHero(0.48, 0.68);

        this.addExit('east', 'market', 'Market Square');
        this.addExit('down', 'mine', 'The Glimmerdeep', {
            x: 0.22, y: 0.74,
            locked: () => GameState.has('pickaxe')
                ? null
                : 'Bram plants a boot in the entrance. "Not without a pick, you do not."'
        });
    }

    addBram() {
        this.npc(0.36, 0.72, '🧔', {
            greeting: 'Bram. Retired from the Glimmerdeep, in the way people retire from things that frightened them.',
            lines: () => {
                if (!GameState.has('pickaxe')) {
                    return [
                        'You are not going down there with your hands.',
                        'Wren sells a pick for sixty. Cheap, for what it saves you.',
                        'The seams still pay. That was never the problem with the Glimmerdeep.'
                    ];
                }
                if (!GameState.hasFlag('minedOre')) {
                    return [
                        'Right. Down you go.',
                        'Work a seam, let it rest, come back to it. They fill again if you are patient.',
                        'And if you hear singing, that is the rock settling. That is all it is.'
                    ];
                }
                return [Phaser.Utils.Array.GetRandom([
                    'Gemstones come up cloudy down there. Wren still pays.',
                    'A sturdier pick is worth the coin if you plan to live in that hole.',
                    'I stopped going down when the singing learned my name. Rock settling. Obviously.'
                ])];
            }
        });
    }

    addScree() {
        this.hotspot(0.62, 0.86, '🪨 loose scree', {
            size: 1.8,
            hover: 'Broken stone, picked over by forty years of miners.',
            onClick: () => {
                if (this.screeSearched) {
                    this.showMessage('Picked clean now. It was picked clean before you got here, really.');
                    return;
                }
                this.screeSearched = true;
                if (Phaser.Math.Between(1, 3) === 1) {
                    GameState.add('gemstone');
                    this.updateInventory();
                    this.floatText(0.62, 0.80, '+💎', '#9fe8ff');
                    this.showMessage('Something cloudy and hard turns up in the rubble. Wren will buy it.');
                } else {
                    const found = Phaser.Math.Between(2, 6);
                    this.gainGold(found, 0.62, 0.80);
                    this.showMessage(`${found} gold, dropped by somebody in a hurry.`);
                }
            }
        });
    }
}
