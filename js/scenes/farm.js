/* =====================================================================
   The Verdant Plot - where the money comes from.

   Plant a seed, wait, harvest. Crops keep growing while you are in other
   rooms, because a plot stores the timestamp it was planted at rather
   than a countdown - see GameState.plots.

   Balance lives in js/data/items.js (growMs, harvestGold) and in
   GameState.growthMultiplier() / harvestMultiplier() for the upgrades.
   ===================================================================== */

class Farm extends AdventureScene {

    constructor() {
        super('farm', 'The Verdant Plot');
    }

    onEnter() {
        this.plotSprites = [];

        this.addTussock();
        this.addSeedPicker();
        this.addPlots();
        this.addStump();

        this.createHero(0.32, 0.42);

        this.addExit('north', 'village', 'Willowbrook Village');

        // Redraw the plot labels a few times a second so crops visibly ripen.
        this.time.addEvent({ delay: 200, loop: true, callback: () => this.refreshPlots() });

        if (!GameState.hasFlag('firstHarvest')) {
            this.showMessage('Pick a seed at the top, click a plot to sow it, then wait.');
        }
    }

    /* ---------- Tussock, who explains the job ---------- */

    addTussock() {
        this.npc(0.76, 0.44, '🧑‍🌾', {
            size: 6,
            greeting: 'Tussock. Has farmed this plot since before the Grey, and intends to keep doing it.',
            lines: () => {
                if (!GameState.has('gardenGlove')) {
                    return ['Soil is packed hard as a road. You want a glove for that.', 'Maple has one. Ask her nicely.'];
                }
                if (!GameState.has('wateringCan')) {
                    return [
                        'Sprouts in, sprouts out. Twelve gold a head and no arguing.',
                        'Buy a watering can when you can afford it. Halves the waiting, and the waiting is the whole job.'
                    ];
                }
                if (!GameState.has('goldenTrowel')) {
                    return ['Better. Now save for the golden trowel — doubles what every harvest pays.'];
                }
                return [Phaser.Utils.Array.GetRandom([
                    'Sunblossoms are slow and fussy and worth every minute. Mira will want three.',
                    'You could buy a deed off Wren. More rows, more coin, same amount of standing about.',
                    'Grey has not reached this field yet. That is not the same as it never will.'
                ])];
            }
        });
    }

    /* ---------- which seed are we planting? ---------- */

    addSeedPicker() {
        this.seedButtons = [];
        this.add.text(this.px(0.02), this.py(0.25), 'Sowing:')
            .setOrigin(0, 0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${1.8 * this.s}px`, color: '#dfe8cf' })
            .setStroke('#12170f', 7);

        const seeds = Object.keys(ITEMS).filter(id => ITEMS[id].plantable);
        seeds.forEach((id, i) => {
            const button = this.hotspot(0.30 + i * 0.28, 0.25, '', {
                size: 1.9,
                hover: () => `${ITEMS[id].blurb} You have ${GameState.count(id)}.`,
                onClick: () => {
                    GameState.selectedSeed = id;
                    GameState.save();
                    this.refreshSeedPicker();
                    this.showMessage(`Now sowing ${itemName(id)}.`);
                }
            });
            button.seedId = id;
            this.seedButtons.push(button);
        });

        this.refreshSeedPicker();
    }

    refreshSeedPicker() {
        this.seedButtons.forEach(button => {
            const id = button.seedId;
            const chosen = GameState.selectedSeed === id;
            button
                .setText(`${chosen ? '▸ ' : '  '}${itemIcon(id)} ${itemName(id)} ×${GameState.count(id)}`)
                .setColor(chosen ? '#ffd97a' : '#b8c6a8');
        });
    }

    /* ---------- the plots themselves ---------- */

    addPlots() {
        const perRow = 4;

        GameState.plots.forEach((plot, i) => {
            const col = i % perRow;
            const row = Math.floor(i / perRow);
            const x = 0.18 + col * 0.17;
            const y = 0.68 + row * 0.20;

            this.add.rectangle(this.px(x), this.py(y), this.px(0.13), this.py(0.15), 0x5a4229)
                .setStrokeStyle(4, 0x7a5c39)
                .setDepth(5);

            const sprite = this.hotspot(x, y, '', {
                size: 2.2,
                onHover: () => this.showMessage(this.plotHint(i)),
                onClick: () => this.clickPlot(i)
            });
            sprite.plotIndex = i;
            sprite.homeX = x;
            sprite.homeY = y;
            this.plotSprites.push(sprite);
        });

        this.refreshPlots();
    }

    /* How far along is plot i? Returns 0..1, or null if nothing planted. */
    progress(i) {
        const plot = GameState.plots[i];
        if (!plot || !plot.seed) return null;
        const seed = ITEMS[plot.seed];
        if (!seed) return null;
        const total = seed.growMs * GameState.growthMultiplier();
        return Phaser.Math.Clamp((Date.now() - plot.plantedAt) / total, 0, 1);
    }

    refreshPlots() {
        if (!this.plotSprites) return;
        this.plotSprites.forEach(sprite => {
            const i = sprite.plotIndex;
            const plot = GameState.plots[i];
            const done = this.progress(i);

            if (!plot || !plot.seed) {
                sprite.setText('🟫\nempty').setColor('#a89478');
                return;
            }

            const seed = ITEMS[plot.seed];
            if (done >= 1) {
                sprite.setText(`${seed.harvestItem ? itemIcon(seed.harvestItem) : '🌾'}\nready!`)
                    .setColor('#c8f09a');
            } else {
                const total = seed.growMs * GameState.growthMultiplier();
                const left = Math.ceil((total - (Date.now() - plot.plantedAt)) / 1000);
                sprite.setText(`🌱\n${left}s`).setColor('#dfe8cf');
            }
        });
    }

    plotHint(i) {
        if (!GameState.has('gardenGlove')) {
            return 'The soil is packed hard. You would want a glove for this.';
        }
        const plot = GameState.plots[i];
        if (!plot.seed) {
            const seed = GameState.selectedSeed;
            return GameState.has(seed)
                ? `Empty. Click to sow ${itemName(seed)}.`
                : `Empty, and you have no ${itemName(seed)}. Wren sells them.`;
        }
        return this.progress(i) >= 1
            ? 'Ready. Click to harvest.'
            : `${itemName(plot.seed)}, still coming along.`;
    }

    clickPlot(i) {
        if (!GameState.has('gardenGlove')) {
            this.showMessage('The soil is packed hard. Elder Maple mentioned a glove.');
            return;
        }

        const plot = GameState.plots[i];
        if (!plot.seed) {
            this.plant(i);
        } else if (this.progress(i) >= 1) {
            this.harvest(i);
        } else {
            this.showMessage('Not yet. Growing is the one part you cannot rush by clicking.');
        }
    }

    plant(i) {
        const seedId = GameState.selectedSeed;
        if (!GameState.has(seedId)) {
            this.showMessage(`You have no ${itemName(seedId)}. Wren sells them in the Market Square.`);
            return;
        }

        GameState.remove(seedId);
        GameState.plots[i].seed = seedId;
        GameState.plots[i].plantedAt = Date.now();
        GameState.save();

        this.updateInventory();
        this.refreshSeedPicker();
        this.refreshPlots();

        const sprite = this.plotSprites[i];
        this.tweens.add({ targets: sprite, scale: { from: 0.6, to: 1 }, duration: 260, ease: 'Back.out' });
        this.showMessage(`${itemName(seedId)} sown.`);
    }

    harvest(i) {
        const plot = GameState.plots[i];
        const seed = ITEMS[plot.seed];
        const sprite = this.plotSprites[i];

        if (seed.harvestGold) {
            const gold = Math.round(seed.harvestGold * GameState.harvestMultiplier());
            this.gainGold(gold, sprite.homeX, sprite.homeY - 0.06);
            this.showMessage(`Harvested. ${gold} gold.`);
        }

        if (seed.harvestItem) {
            GameState.add(seed.harvestItem);
            this.updateInventory();
            this.floatText(sprite.homeX, sprite.homeY - 0.06, `+${itemIcon(seed.harvestItem)}`, '#c8f09a');
            this.showMessage(`A ${itemName(seed.harvestItem)}. It is warm.`);
        }

        plot.seed = null;
        plot.plantedAt = 0;
        GameState.setFlag('firstHarvest');
        GameState.save();

        this.refreshPlots();
        this.tweens.add({ targets: sprite, scale: { from: 1.4, to: 1 }, duration: 300, ease: 'Back.out' });
    }

    /* ---------- the stump: one of the five endings starts here ---------- */

    addStump() {
        this.hotspot(0.05, 0.88, '🪵', {
            size: 3.5,
            hover: () => GameState.has('heartseed')
                ? 'Good soil, this. Deep, and nobody watching.'
                : 'The stump of something that was old when the village was new.',
            onClick: () => {
                if (!GameState.has('heartseed')) {
                    this.showMessage('You could plant something here, if you ever had anything worth planting.');
                    return;
                }
                if (this.graftArmed) {
                    GameState.remove('heartseed');
                    this.gotoScene('endingGrafting');
                    return;
                }
                this.graftArmed = true;
                this.showMessage('You could put the Heartseed in this ground instead. It would grow. It would be yours. Click again to do it.');
                this.time.delayedCall(6000, () => this.graftArmed = false);
            }
        });
    }
}
