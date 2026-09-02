/* =====================================================================
   Market Square - the shop, and the crossroads of the whole map.

   Wren's stock lives in js/data/items.js, not here. This room only knows
   how to draw a list and take your money.
   ===================================================================== */

class Market extends AdventureScene {

    constructor() {
        super('market', 'Market Square');
    }

    onEnter() {
        this.addWren();
        this.addFlavour();

        this.createHero(0.30, 0.70);

        this.addExit('south', 'village', 'Willowbrook Village');
        this.addExit('west', 'ridge', 'Stony Ridge');
        this.addExit('east', 'woods', 'Whispering Woods');
        this.addExit('north', 'watchtower', 'Ruined Watchtower');
    }

    addWren() {
        const wren = this.npc(0.18, 0.68, '🧕', {
            greeting: 'Wren. She has sold something to everyone in this valley twice.',
            lines: () => {
                if (!GameState.hasFlag('shoppedOnce')) {
                    return [
                        'New face. Good. The old ones have stopped buying.',
                        'Seed, tools, rope, light. And one or two things I keep under the counter.',
                        'Click the stall when you want to look properly.'
                    ];
                }
                return [Phaser.Utils.Array.GetRandom([
                    'Prices are prices. I did not set the world up this way.',
                    'The silver charm? Bought it off a tinker who would not say where he got it.',
                    'Bram has not been down the Glimmerdeep in a month. Say hello for me.',
                    'If you are going under the woods, buy the lantern. Do not be clever about it.'
                ])];
            },
            onClick: () => this.time.delayedCall(900, () => this.openShop())
        });
        return wren;
    }

    addFlavour() {
        this.hotspot(0.52, 0.66, '🧺 Wren\'s stall', {
            size: 2,
            hover: 'Everything worth buying in Willowbrook, on one trestle table.',
            onClick: () => this.openShop()
        });

        this.hotspot(0.86, 0.74, '🐕', {
            size: 4,
            hover: 'A dog of no particular allegiance.',
            onClick: (dog) => {
                this.showMessage('The dog accepts your attention as its due.');
                this.tweens.add({
                    targets: dog, angle: { from: -12, to: 12 },
                    yoyo: true, repeat: 4, duration: 110,
                    onComplete: () => dog.setAngle(0)
                });
            }
        });
    }

    /* =================================================================
       THE SHOP
       ================================================================= */

    openShop() {
        GameState.setFlag('shoppedOnce');
        this.closeOverlay();
        this.openOverlay();

        this.overlayText(0.5, 0.09, "WREN'S STALL", { size: 3, color: '#cfe8b0', originX: 0.5 });
        this.overlayText(0.5, 0.15, `You have ${GameState.gold} gold.`, {
            size: 1.9, color: '#ffd97a', originX: 0.5
        });

        let y = 0.23;
        SHOP_STOCK.filter(itemAvailable).forEach(id => {
            this.shopRow(y, id);
            y += 0.062;
        });

        // Wren buys as well as sells.
        const sellable = Object.keys(ITEMS).filter(id => ITEMS[id].sellPrice && GameState.has(id));
        if (sellable.length > 0) {
            y += 0.02;
            this.overlayText(0.10, y, 'She will take these off your hands:', { size: 1.7, color: '#8fae74' });
            y += 0.06;
            sellable.forEach(id => {
                this.sellRow(y, id);
                y += 0.06;
            });
        }

        this.overlayText(0.5, 0.94, '[ done ]', {
            size: 2, color: '#ffd97a', originX: 0.5,
            onClick: () => this.closeOverlay()
        });
    }

    shopRow(y, id) {
        const item = ITEMS[id];
        const affordable = GameState.canAfford(item.price);
        const owned = GameState.count(id);

        const colour = affordable ? '#e8e4c8' : '#8a8272';
        const buy = () => this.buy(id);
        const hover = () => this.showMessage(item.blurb);

        this.overlayText(0.10, y, `${item.icon}  ${item.name}${owned > 0 ? `  (you have ${owned})` : ''}`, {
            size: 1.9, color: colour, onClick: buy, onHover: hover
        });

        this.overlayText(0.62, y, `${item.price} gold`, {
            size: 1.9, color: affordable ? '#ffd97a' : '#7a6a4a', onClick: buy, onHover: hover
        });
    }

    sellRow(y, id) {
        const item = ITEMS[id];
        const n = GameState.count(id);
        const sell = () => {
            GameState.remove(id);
            this.gainGold(item.sellPrice);
            this.updateInventory();
            this.showMessage(`Wren weighs it, shrugs, and pays ${item.sellPrice} gold.`);
            // Deferred: this row is about to destroy itself mid-click.
            this.time.delayedCall(10, () => this.openShop());
        };

        this.overlayText(0.10, y, `${item.icon}  ${item.name} ×${n}`, {
            size: 1.7, color: '#c8d4b8', onClick: sell
        });
        this.overlayText(0.62, y, `sell for ${item.sellPrice}`, {
            size: 1.7, color: '#9fd0a0', onClick: sell
        });
    }

    buy(id) {
        const item = ITEMS[id];

        if (!GameState.canAfford(item.price)) {
            this.showMessage(`"${item.price} gold," says Wren, "and not a copper less."`);
            return;
        }

        GameState.spend(item.price);

        if (item.onBuy) {
            item.onBuy(this);          // deeds and the like act immediately
        } else {
            GameState.add(id);
            this.showMessage(`Bought ${itemLabel(id)}.`);
        }

        this.refreshGold();
        this.updateInventory();
        // Deferred: the row that was clicked is destroyed by the redraw.
        this.time.delayedCall(10, () => this.openShop());
    }
}
