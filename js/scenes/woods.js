/* =====================================================================
   The Whispering Woods - the fork in the road.

   East is the Heartwood. South, if you have a light, is the Sunken
   Hollow. And Rilla is here, who will take your money one way or another.
   ===================================================================== */

const WAGER = 20;
const RILLA_OFFER = 500;

class Woods extends AdventureScene {

    constructor() {
        super('woods', 'Whispering Woods');
    }

    onEnter() {
        this.addRilla();
        this.addMushrooms();

        this.createHero(0.34, 0.66);

        this.addExit('west', 'market', 'Market Square');
        this.addExit('east', 'grove', 'Heartwood Grove');
        this.addExit('south', 'hollow', 'The Sunken Hollow', {
            locked: () => GameState.has('lantern')
                ? null
                : 'The path south goes under the roots and straight into the dark. Not without a light.'
        });

        if (GameState.has('heartseed')) {
            this.addRillasOffer();
        }
    }

    /* ---------- Rilla: gambler, gossip, and the merchant ending ---------- */

    addRilla() {
        this.npc(0.60, 0.62, '🦊', {
            size: 6,
            idleSpeed: 1500,
            greeting: () => GameState.has('heartseed')
                ? 'Rilla is sitting very still, and looking at your bag.'
                : 'A fox, sitting like a person, who has clearly been waiting for you.',
            lines: () => {
                if (GameState.has('heartseed')) {
                    return [
                        `"I will give you ${RILLA_OFFER} gold for it."`,
                        '"There are three cities downriver that would empty their treasuries for a seed that beats."',
                        '"The valley goes grey either way, adventurer. At least this way one of us is comfortable."'
                    ];
                }
                if (!GameState.hasFlag('metRilla')) {
                    GameState.setFlag('metRilla');
                    return [
                        '"You are the gardener. Good. I was starting to think nobody would come."',
                        '"South, under the roots, there is a chapel that sank. That is where the tree keeps its spare."',
                        '"Take a light. And take something silver, unless you are in a hurry to stop existing."',
                        `"Or stay here and toss a coin with me. ${WAGER} gold. Double or nothing."`
                    ];
                }
                return [Phaser.Utils.Array.GetRandom([
                    '"Everyone in this valley is waiting for someone else to fix it. You are just the one who showed up."',
                    '"Sister Bell will help you. She helps everybody. It has not made her happy."',
                    '"The Grey is not evil. Neither is winter. That has never been much comfort."',
                    `"Coin toss? ${WAGER} gold. I am very trustworthy."`
                ])];
            }
        });

        this.hotspot(0.60, 0.80, `🪙 toss a coin (${WAGER} gold)`, {
            size: 1.8,
            hover: `Double or nothing, on Rilla's coin. She insists it is a normal coin.`,
            onClick: () => this.gamble()
        });
    }

    gamble() {
        if (!GameState.canAfford(WAGER)) {
            this.showMessage(`"Come back with ${WAGER} gold," says Rilla, "and we will find out who you are."`);
            return;
        }

        this.spendGold(WAGER, 0.60, 0.74);

        this.time.delayedCall(700, () => {
            if (Math.random() < 0.5) {
                this.gainGold(WAGER * 2, 0.60, 0.72);
                this.showMessage(`"Ha!" Rilla pushes ${WAGER * 2} gold across the moss. "Again?"`);
            } else {
                this.showMessage('The coin comes up wrong. Rilla does not gloat, which is somehow worse.');
            }
        });
    }

    /* Appears only while you are carrying the Heartseed. */
    addRillasOffer() {
        this.hotspot(0.60, 0.88, `🤝 sell the Heartseed (${RILLA_OFFER} gold)`, {
            size: 1.8,
            color: '#ffd97a',
            hover: 'She has the coin counted out already. She counted it before you got here.',
            onClick: () => {
                if (this.offerArmed) {
                    GameState.remove('heartseed');
                    GameState.earn(RILLA_OFFER);
                    this.refreshGold();
                    this.updateInventory();
                    this.gotoScene('endingGilded');
                    return;
                }
                this.offerArmed = true;
                this.showMessage('This would end it. You would be rich, and the valley would not be saved. Click again to take the money.');
                this.time.delayedCall(6000, () => this.offerArmed = false);
            }
        });
    }

    addMushrooms() {
        this.hotspot(0.16, 0.82, '🍄 a ring of mushrooms', {
            size: 1.8,
            hover: 'Growing in a circle, the way they are not supposed to.',
            onClick: () => {
                if (this.ringSearched) {
                    this.showMessage('The ring has closed up behind you. Mushrooms do not do that.');
                    return;
                }
                this.ringSearched = true;
                const found = Phaser.Math.Between(3, 8);
                this.gainGold(found, 0.16, 0.76);
                this.showMessage(`Somebody left ${found} gold in the middle of the ring. As payment, or as an apology.`);
            }
        });
    }
}
