/* =====================================================================
   Mira's Hut - the crafting room.

   Three Sunblossoms and sixty gold become the Sunlight Elixir, which is
   one of the two things the Heartwood needs.
   ===================================================================== */

const ELIXIR_FEE = 60;
const ELIXIR_FLOWERS = 3;

class Alchemist extends AdventureScene {

    constructor() {
        super('alchemist', "Mira's Hut");
    }

    onEnter() {
        this.addMira();
        this.addCauldron();
        this.addShelf();

        this.createHero(0.24, 0.66);

        this.addExit('west', 'village', 'Willowbrook Village');
    }

    addMira() {
        this.npc(0.72, 0.62, '🧙‍♀️', {
            greeting: 'Mira. Smells of woodsmoke and something citrus that is not citrus.',
            lines: () => {
                if (GameState.has('sunlightElixir')) {
                    return [
                        'Keep it upright and keep it dark until you need it.',
                        'And do not drink it. People always want to drink it.'
                    ];
                }
                if (GameState.has('sunblossom', ELIXIR_FLOWERS)) {
                    return [
                        'Three Sunblossoms. You actually grew them.',
                        `Sixty gold for the brewing — glass is expensive and my time is worse.`,
                        'Put them in the cauldron when you are ready.'
                    ];
                }
                if (GameState.has('sunblossom')) {
                    return [
                        `${GameState.count('sunblossom')} is not three.`,
                        'The Grey does not fear a little light. It has to be a whole afternoon of it.'
                    ];
                }
                return [
                    'You want the Sunlight Elixir. Everyone who walks in here wants the Sunlight Elixir.',
                    `Bring me three Sunblossoms and ${ELIXIR_FEE} gold and you can stop wanting it.`,
                    'Wren sells the seed. Grow them yourself — bought flowers have no afternoon left in them.'
                ];
            }
        });
    }

    addCauldron() {
        const cauldron = this.hotspot(0.42, 0.72, '🫕', {
            size: 7,
            hover: () => GameState.has('sunblossom', ELIXIR_FLOWERS)
                ? `Click to brew. It will cost ${ELIXIR_FLOWERS} Sunblossoms and ${ELIXIR_FEE} gold.`
                : 'Something in it is turning over slowly, without any heat under it.',
            onClick: () => this.brew(cauldron)
        });

        // A slow glow, so the room has a heartbeat.
        this.tweens.add({
            targets: cauldron,
            alpha: { from: 1, to: 0.72 },
            yoyo: true, repeat: -1, duration: 2400, ease: 'Sine.inOut'
        });

        return cauldron;
    }

    brew(cauldron) {
        if (GameState.has('sunlightElixir')) {
            this.showMessage('"One is enough," says Mira. "Two would be showing off."');
            return;
        }
        if (!GameState.has('sunblossom', ELIXIR_FLOWERS)) {
            this.showMessage(`You need ${ELIXIR_FLOWERS} Sunblossoms. You have ${GameState.count('sunblossom')}.`);
            return;
        }
        if (!GameState.canAfford(ELIXIR_FEE)) {
            this.showMessage(`Mira does not work for nothing. ${ELIXIR_FEE} gold.`);
            return;
        }

        this.spendGold(ELIXIR_FEE, 0.42, 0.62);
        GameState.remove('sunblossom', ELIXIR_FLOWERS);
        this.updateInventory();

        this.speak(null, [
            'Mira drops the flowers in one at a time and does not stir.',
            'The room goes warm. Somewhere behind your eyes it is June.',
            'She corks the bottle before you can look at it properly.'
        ], 2200);

        this.tweens.add({
            targets: cauldron,
            scale: { from: 1, to: 1.3 },
            yoyo: true, duration: 900, ease: 'Sine.inOut'
        });

        this.time.delayedCall(6600, () => {
            GameState.add('sunlightElixir');
            GameState.setFlag('brewedElixir');
            this.updateInventory();
            this.showMessage('You are carrying the Sunlight Elixir.');
            this.floatText(0.42, 0.60, '🧪', '#ffe08a');
        });
    }

    addShelf() {
        this.hotspot(0.50, 0.30, '🧫 the shelves', {
            size: 1.8,
            hover: 'Rows and rows of small labelled disasters.',
            onClick: () => {
                if (GameState.has('skyShard')) {
                    this.speak(null, [
                        'Mira looks up sharply. "Where did you get that shard?"',
                        '"That is older than the tree. Older than the valley."',
                        '"Keep hold of it. If the Heartwood takes, that will decide what it becomes."'
                    ]);
                    GameState.setFlag('shardIdentified');
                    return;
                }
                this.showMessage(Phaser.Utils.Array.GetRandom([
                    'One jar is labelled DO NOT. There is no second word.',
                    'A bottle of something grey. It has been sealed with wax three times over.',
                    'Most of these are just very old jam.'
                ]));
            }
        });
    }
}
