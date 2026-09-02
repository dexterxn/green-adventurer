/* =====================================================================
   AdventureScene - the base class every room extends.

   It owns the furniture that is the same in all rooms: the sidebar, the
   message box, the gold counter, the inventory list, the exits, and the
   little helpers rooms use to put things on screen.

   A room file only has to do two things:

       class MyRoom extends AdventureScene {
           constructor() { super('myRoom', 'The Name In The Sidebar'); }
           onEnter() { ...put things in the room... }
       }

   POSITIONS ARE FRACTIONS, NOT PIXELS.
   this.px(0.5), this.py(0.5) is the middle of the picture. The picture is
   the left 75% of the canvas; the sidebar owns the rest and the helpers
   below never draw into it. This matches the coordinate system the
   background painter uses, so a prop and the art under it line up.
   ===================================================================== */

/* Phaser defaults to Courier, which looks like an accident. One stack,
   used by every piece of text in the game - change it here and it changes
   everywhere, including the title and the endings. */
const FONT = 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif';

class AdventureScene extends Phaser.Scene {

    constructor(key, name) {
        super(key);
        this.name = name;
    }

    create() {
        this.transitionDuration = 700;

        this.w = this.game.config.width;
        this.h = this.game.config.height;
        this.s = this.w * 0.01;          // one "unit" - all sizing is in these
        this.playW = this.w * 0.75;      // width of the picture, minus sidebar

        this.speechTimers = [];

        this.cameras.main.setBackgroundColor('#0d120c');
        this.cameras.main.fadeIn(this.transitionDuration, 0, 0, 0);

        paintRoom(this, this.artKey || this.scene.key);
        this.buildSidebar();

        this.onEnter();
    }

    /* ---------- coordinate helpers ---------- */

    px(fraction) { return this.playW * fraction; }
    py(fraction) { return this.h * fraction; }

    /* =================================================================
       SIDEBAR
       ================================================================= */

    buildSidebar() {
        const left = this.w * 0.75 + this.s;
        const wrap = this.w * 0.25 - 2 * this.s;

        this.add.rectangle(this.w * 0.75, 0, this.w * 0.25, this.h)
            .setOrigin(0, 0)
            .setFillStyle(0x0f130d)
            .setDepth(40);

        this.add.rectangle(this.w * 0.75, 0, this.s * 0.3, this.h)
            .setOrigin(0, 0)
            .setFillStyle(0x4f7a3a)
            .setDepth(41);

        this.add.text(left, this.s, this.name)
            .setStyle({ fontFamily: FONT, fontSize: `${2.6 * this.s}px`, color: '#cfe8b0' })
            .setWordWrapWidth(wrap)
            .setDepth(42);

        this.goldText = this.add.text(left, this.h * 0.11, '')
            .setStyle({ fontFamily: FONT, fontSize: `${2.2 * this.s}px`, color: '#ffd97a' })
            .setDepth(42);

        this.messageBox = this.add.text(left, this.h * 0.19, '')
            .setStyle({ fontFamily: FONT, fontSize: `${1.9 * this.s}px`, color: '#eeeacc' })
            .setWordWrapWidth(wrap)
            .setDepth(42);

        this.inventoryBanner = this.add.text(left, this.h * 0.47, 'Carrying')
            .setStyle({ fontFamily: FONT, fontSize: `${1.9 * this.s}px`, color: '#8fae74' })
            .setAlpha(0)
            .setDepth(42);

        this.inventoryTexts = [];
        this.refreshGold();
        this.updateInventory();

        this.buildSidebarButtons();
    }

    buildSidebarButtons() {
        const y = this.h * 0.94;

        this.sidebarButton(this.w * 0.77, y, '📖', 'What now?', () => {
            this.showMessage(nextHint());
        });

        this.sidebarButton(this.w * 0.86, y, '🔄', 'Start over?', () => {
            if (this.resetArmed) {
                GameState.reset();
                this.scene.start('intro');
            } else {
                this.resetArmed = true;
                this.showMessage('That would abandon this run. Click again to be sure.');
                this.time.delayedCall(4000, () => this.resetArmed = false);
            }
        });

        this.sidebarButton(this.w * 0.95, y, '📺', 'Fullscreen?', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });
    }

    sidebarButton(x, y, icon, hint, action) {
        return this.add.text(x, y, icon)
            .setStyle({ fontFamily: FONT, fontSize: `${2.2 * this.s}px` })
            .setDepth(42)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.showMessage(hint))
            .on('pointerdown', action);
    }

    /* =================================================================
       MESSAGES AND DIALOGUE
       ================================================================= */

    showMessage(message) {
        if (!message) return;
        this.messageBox.setText(message).setAlpha(1);
        if (this.messageTween) this.messageTween.stop();
        this.messageTween = this.tweens.add({
            targets: this.messageBox,
            alpha: { from: 1, to: 0 },
            delay: 2800,
            duration: 1800,
            ease: 'Quintic.in'
        });
    }

    /* Say several lines in a row. Pass a string or an array of strings. */
    speak(sprite, lines, gap = 3000) {
        this.clearSpeech();
        const script = Array.isArray(lines) ? lines : [lines];
        script.forEach((line, i) => {
            if (i === 0) {
                this.showMessage(line);
            } else {
                this.speechTimers.push(this.time.delayedCall(i * gap, () => this.showMessage(line)));
            }
        });
        if (sprite) this.nod(sprite);
    }

    clearSpeech() {
        if (this.speechTimers) this.speechTimers.forEach(t => t.remove(false));
        this.speechTimers = [];
    }

    /* A small "I am talking" wobble. Uses angle so it never fights an
       idle tween that is animating position. */
    nod(sprite) {
        this.tweens.add({
            targets: sprite,
            angle: { from: -5, to: 5 },
            yoyo: true,
            repeat: 2,
            duration: 90,
            onComplete: () => sprite.setAngle(0)
        });
    }

    /* =================================================================
       GOLD
       ================================================================= */

    refreshGold() {
        this.goldText.setText(`🪙 ${GameState.gold} gold`);
    }

    gainGold(amount, x, y) {
        GameState.earn(amount);
        this.refreshGold();
        this.tweens.add({
            targets: this.goldText,
            scale: { from: 1.25, to: 1 },
            duration: 320,
            ease: 'Back.out'
        });
        if (x !== undefined) this.floatText(x, y, `+${amount} 🪙`);
    }

    spendGold(amount, x, y) {
        if (!GameState.spend(amount)) return false;
        this.refreshGold();
        if (x !== undefined) this.floatText(x, y, `-${amount} 🪙`, '#e79a9a');
        return true;
    }

    /* A number that drifts up out of the thing you just clicked. */
    floatText(x, y, text, color = '#ffe08a') {
        const t = this.add.text(this.px(x), this.py(y), text)
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${2.2 * this.s}px`, color })
            .setStroke('#12170f', 8)
            .setDepth(30);
        this.tweens.add({
            targets: t,
            y: t.y - this.py(0.09),
            alpha: { from: 1, to: 0 },
            duration: 1300,
            ease: 'Cubic.out',
            onComplete: () => t.destroy()
        });
    }

    /* =================================================================
       INVENTORY
       ================================================================= */

    hasItem(id, howMany = 1) { return GameState.has(id, howMany); }

    gainItem(id, howMany = 1) {
        GameState.add(id, howMany);
        this.updateInventory();
        this.showMessage(`Picked up ${itemLabel(id)}${howMany > 1 ? ` ×${howMany}` : ''}.`);
    }

    loseItem(id, howMany = 1) {
        GameState.remove(id, howMany);
        this.updateInventory();
    }

    updateInventory() {
        const carrying = GameState.carrying();

        this.tweens.add({
            targets: this.inventoryBanner,
            alpha: carrying.length > 0 ? 1 : 0,
            duration: this.transitionDuration
        });

        if (this.inventoryTexts) this.inventoryTexts.forEach(t => t.destroy());
        this.inventoryTexts = [];

        let y = this.h * 0.52;
        carrying.forEach(id => {
            const n = GameState.count(id);
            const text = this.add.text(
                this.w * 0.75 + 2 * this.s,
                y,
                `${itemLabel(id)}${n > 1 ? ` ×${n}` : ''}`
            )
                .setStyle({ fontFamily: FONT, fontSize: `${1.45 * this.s}px`, color: '#d6d2b8' })
                .setWordWrapWidth(this.w * 0.25 - 3 * this.s)
                .setDepth(42);
            y += text.height + this.s * 0.5;
            this.inventoryTexts.push(text);
        });
    }

    /* =================================================================
       THINGS TO PUT IN A ROOM
       ================================================================= */

    /* A clickable thing. Everything in every room is one of these. */
    hotspot(x, y, text, opts = {}) {
        const spot = this.add.text(this.px(x), this.py(y), text)
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${(opts.size || 2) * this.s}px`, color: opts.color || '#ffffff' })
            .setStroke('#12170f', opts.stroke === undefined ? 8 : opts.stroke)
            .setDepth(opts.depth || 10)
            .setInteractive({ useHandCursor: true });

        if (opts.onHover) {
            spot.on('pointerover', () => opts.onHover(spot));
        } else if (opts.hover) {
            spot.on('pointerover', () => {
                this.showMessage(typeof opts.hover === 'function' ? opts.hover() : opts.hover);
            });
        }

        if (opts.onClick) spot.on('pointerdown', () => opts.onClick(spot));

        // A little lift on hover so it reads as clickable.
        spot.on('pointerover', () => this.tweens.add({
            targets: spot, scale: 1.08, duration: 140, ease: 'Sine.out'
        }));
        spot.on('pointerout', () => this.tweens.add({
            targets: spot, scale: 1, duration: 140, ease: 'Sine.out'
        }));

        return spot;
    }

    /* A person. Hovering greets you, clicking makes them talk.
       `greeting` and `lines` can be functions if the dialogue should
       depend on how far along the story is. */
    npc(x, y, emoji, opts = {}) {
        const sprite = this.hotspot(x, y, emoji, {
            size: opts.size || 7,
            hover: opts.greeting,
            onClick: () => {
                const lines = typeof opts.lines === 'function' ? opts.lines() : opts.lines;
                if (lines) this.speak(sprite, lines);
                if (opts.onClick) opts.onClick(sprite);
            }
        });

        if (opts.idle !== false) {
            this.tweens.add({
                targets: sprite,
                y: sprite.y - this.s * 0.8,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut',
                duration: opts.idleSpeed || 1900
            });
        }

        return sprite;
    }

    /* An item lying on the ground. Click it and it goes in your bag. */
    pickup(x, y, itemId, opts = {}) {
        const spot = this.hotspot(x, y, opts.label || itemLabel(itemId), {
            size: opts.size || 2,
            hover: opts.hover || (ITEMS[itemId] ? ITEMS[itemId].blurb : 'Something is lying here.'),
            onClick: () => {
                this.gainItem(itemId, opts.amount || 1);
                if (opts.onTake) opts.onTake();
                this.tweens.add({
                    targets: spot,
                    y: spot.y - 3 * this.s,
                    alpha: { from: 1, to: 0 },
                    duration: 500,
                    onComplete: () => spot.destroy()
                });
            }
        });
        return spot;
    }

    /* The player's little figure. Exits walk them off the edge. */
    createHero(x = 0.30, y = 0.62) {
        this.hero = this.add.text(this.px(x), this.py(y), '🧝')
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${7 * this.s}px` })
            .setDepth(9)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.showMessage('You. Last of a very small order of wandering gardeners.'))
            .on('pointerdown', () => this.speak(this.hero, [
                'You check your pockets. Still mostly dirt.',
                `You are carrying ${GameState.gold} gold.`
            ]));

        this.tweens.add({
            targets: this.hero,
            y: this.hero.y - this.s,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            duration: 2200
        });

        return this.hero;
    }

    /* =================================================================
       EXITS

       addExit('north', 'market', 'Market Square')

       Pass { locked: () => 'why you cannot go' } to gate a direction -
       return a string to block with that message, or null to allow it.
       ================================================================= */

    addExit(direction, sceneKey, caption, opts = {}) {
        const spots = {
            north: { x: 0.36, y: 0.07, icon: '⬆️', dx: 0, dy: -0.25 },
            south: { x: 0.36, y: 0.90, icon: '⬇️', dx: 0, dy: 0.25 },
            west: { x: 0.09, y: 0.46, icon: '⬅️', dx: -0.3, dy: 0 },
            east: { x: 0.66, y: 0.46, icon: '➡️', dx: 0.3, dy: 0 },
            in: { x: 0.86, y: 0.20, icon: '🚪', dx: 0.2, dy: -0.1 },
            down: { x: 0.66, y: 0.90, icon: '🕳️', dx: 0.2, dy: 0.2 }
        };

        const spot = spots[direction] || spots.north;
        const x = opts.x !== undefined ? opts.x : spot.x;
        const y = opts.y !== undefined ? opts.y : spot.y;

        const arrow = this.hotspot(x, y, spot.icon, {
            size: 4,
            hover: () => {
                const blocked = opts.locked ? opts.locked() : null;
                return blocked || `${caption} lies this way.`;
            },
            onClick: () => {
                const blocked = opts.locked ? opts.locked() : null;
                if (blocked) {
                    this.showMessage(blocked);
                    this.tweens.add({
                        targets: arrow,
                        x: { from: arrow.x - this.s, to: arrow.x + this.s },
                        yoyo: true, repeat: 2, duration: 60,
                        onComplete: () => arrow.setX(this.px(x))
                    });
                    return;
                }
                if (opts.onUse) opts.onUse();
                this.walkHeroOut(spot.dx, spot.dy);
                this.gotoScene(sceneKey);
            }
        });

        this.add.text(this.px(x), this.py(y) + this.s * 3.2, caption)
            .setOrigin(0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${1.4 * this.s}px`, color: '#e8f0d8' })
            .setStroke('#12170f', 7)
            .setDepth(10);

        return arrow;
    }

    walkHeroOut(dx, dy) {
        if (!this.hero) return;
        this.tweens.add({
            targets: this.hero,
            x: this.hero.x + this.px(dx),
            y: this.hero.y + this.py(dy),
            duration: this.transitionDuration,
            onComplete: () => this.hero.destroy()
        });
    }

    gotoScene(key) {
        this.clearSpeech();
        this.cameras.main.fade(this.transitionDuration, 0, 0, 0);
        this.time.delayedCall(this.transitionDuration, () => this.scene.start(key));
    }

    /* =================================================================
       OVERLAY PANELS (the shop, the noticeboard)
       ================================================================= */

    /* Dims the picture and returns the backdrop, so a panel reads on top
       of whatever art is behind it. Track everything you add and destroy
       it together - see closeOverlay(). */
    openOverlay() {
        this.overlayParts = [];
        const shade = this.add.rectangle(0, 0, this.playW, this.h, 0x070a06, 0.78)
            .setOrigin(0, 0)
            .setDepth(50)
            .setInteractive();   // swallows clicks on things behind it
        this.overlayParts.push(shade);
        return shade;
    }

    overlayText(x, y, text, opts = {}) {
        const t = this.add.text(this.px(x), this.py(y), text)
            .setOrigin(opts.originX === undefined ? 0 : opts.originX, 0.5)
            .setStyle({ fontFamily: FONT, fontSize: `${(opts.size || 1.7) * this.s}px`, color: opts.color || '#e8e4c8' })
            .setDepth(51);
        if (opts.wrap) t.setWordWrapWidth(this.px(opts.wrap));
        if (opts.onClick) {
            t.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => opts.onClick(t))
                .on('pointerover', () => {
                    t.setColor(opts.hoverColor || '#ffffff');
                    if (opts.onHover) opts.onHover(t);
                })
                .on('pointerout', () => t.setColor(opts.color || '#e8e4c8'));
        }
        if (this.overlayParts) this.overlayParts.push(t);
        return t;
    }

    closeOverlay() {
        if (!this.overlayParts) return;
        this.overlayParts.forEach(p => p.destroy());
        this.overlayParts = null;
    }

    onEnter() {
        console.warn('This room did not implement onEnter():', this.constructor.name);
    }
}
