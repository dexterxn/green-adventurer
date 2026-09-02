/* =====================================================================
   Willowbrook Village - the hub.

   Everything else hangs off this room. Elder Maple starts the story and
   hands you your first coin, Pip gossips, the noticeboard is your quest
   log, and three roads lead out.
   ===================================================================== */

class Village extends AdventureScene {

    constructor() {
        super('village', 'Willowbrook Village');
    }

    onEnter() {
        this.wellSearched = false;

        this.addElderMaple();
        this.addPip();
        this.addWell();
        this.addNoticeboard();

        this.createHero(0.30, 0.68);

        this.addExit('north', 'market', 'Market Square');
        this.addExit('south', 'farm', 'The Verdant Plot');
        this.addExit('east', 'alchemist', "Mira's Hut");

        if (!GameState.hasFlag('metElder')) {
            this.showMessage('The old woman by the well has been watching the road for a while.');
        }
    }

    /* ---------- Elder Maple: quest giver ---------- */

    addElderMaple() {
        const elder = this.npc(0.15, 0.66, '🧓', {
            greeting: () => GameState.hasFlag('metElder')
                ? 'Elder Maple. She has not sat down since spring.'
                : 'An old woman, watching the road. She has been expecting somebody.',
            lines: () => {
                if (!GameState.hasFlag('metElder')) {
                    return [
                        'You came. Good. I am Maple, and I am the last one here who remembers the Heartwood green.',
                        'The Grey took it in the spring. Every week it takes a little more of the valley with it.',
                        'Here. Twelve gold and my old glove. It is not much, but the plot south of here still takes a seed.',
                        'Earn what you can first. You will need coin before you need courage.',
                        'When you are ready: Wren sells, Mira brews, and the woods east of the market keep their own counsel.'
                    ];
                }
                return [
                    nextHint(),
                    this.elderLore()
                ];
            },
            onClick: () => {
                if (GameState.hasFlag('metElder')) return;
                GameState.setFlag('metElder');
                // Granted quietly so the dialogue above is not talked over.
                GameState.earn(12);
                GameState.add('gardenGlove');
                this.refreshGold();
                this.updateInventory();
                this.floatText(0.15, 0.55, '+12 🪙');
            }
        });
        return elder;
    }

    elderLore() {
        return Phaser.Utils.Array.GetRandom([
            'The Heartwood was here before the village. We were the ones who moved in.',
            'A tree that old keeps a seed back. For after. It never expected to need it.',
            'Do not let Rilla talk you into a coin toss. She has been at it longer than you have been alive.',
            'Sister Bell died two hundred years ago and she still keeps that chapel tidy.',
            'The Grey is not a fire. It does not want to burn you. It wants you to stop.'
        ]);
    }

    /* ---------- Pip: local child, unreliable narrator ---------- */

    addPip() {
        this.npc(0.58, 0.72, '🧒', {
            size: 5,
            idleSpeed: 1300,
            greeting: 'A kid with mud to the knee. Definitely following you.',
            lines: () => {
                if (GameState.gold >= 300) {
                    return ["You're RICH.", 'Are you going to buy the whole market? Buy the market.'];
                }
                if (GameState.has('heartseed')) {
                    return ['What IS that. It sounds like a heartbeat.', 'Can I hold it? ...Fine. Fine!'];
                }
                if (GameState.gold < 20) {
                    return ['Mum says you cannot buy bravery.', 'I think you can. I think it is about a hundred and fifty gold.'];
                }
                return [Phaser.Utils.Array.GetRandom([
                    'Bram used to sing in the mine. He stopped when the singing came back.',
                    'The fox in the woods talks. Nobody believes me. She TALKS.',
                    'There is something shiny on the tower. I would get it but I am not allowed rope.',
                    'Mira turned a bucket into a different bucket once. It was amazing.'
                ])];
            }
        });
    }

    /* ---------- the well: a tiny bit of found money ---------- */

    addWell() {
        this.hotspot(0.40, 0.80, '🪣 the old well', {
            size: 2,
            hover: 'Wishes went in. Occasionally something comes back out.',
            onClick: () => {
                if (this.wellSearched) {
                    this.showMessage('Nothing down there now but frogs and other people\'s hopes.');
                    return;
                }
                this.wellSearched = true;
                const found = Phaser.Math.Between(1, 4);
                this.gainGold(found, 0.40, 0.74);
                this.showMessage(`You fish ${found} gold out of the bucket. Somebody wished badly.`);
            }
        });
    }

    /* ---------- noticeboard: the quest log ---------- */

    addNoticeboard() {
        this.hotspot(0.80, 0.62, '📜 noticeboard', {
            size: 2,
            hover: 'Everything the village agrees needs doing.',
            onClick: () => this.showQuestBoard()
        });
    }

    showQuestBoard() {
        this.openOverlay();

        this.overlayText(0.5, 0.12, 'THE NOTICEBOARD', { size: 3.2, color: '#cfe8b0', originX: 0.5 });

        let y = 0.24;
        currentObjectives().forEach(obj => {
            this.overlayText(0.12, y, `${obj.done ? '☑' : '☐'}  ${obj.text}`, {
                size: 1.9,
                color: obj.done ? '#6f8f5a' : '#e8e4c8',
                wrap: 0.78
            });
            y += 0.075;
        });

        y += 0.03;
        this.overlayText(0.12, y, 'Scrawled in the margin:', { size: 1.7, color: '#8fae74' });
        y += 0.06;
        sideObjectives().forEach(obj => {
            this.overlayText(0.12, y, `${obj.done ? '☑' : '☐'}  ${obj.text}`, {
                size: 1.7,
                color: obj.done ? '#6f8f5a' : '#b8b49c',
                wrap: 0.78
            });
            y += 0.06;
        });

        this.overlayText(0.5, 0.93, '[ close ]', {
            size: 2,
            color: '#ffd97a',
            originX: 0.5,
            onClick: () => this.closeOverlay()
        });
    }
}
