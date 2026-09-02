/* =====================================================================
   GameState - the single place every room reads and writes progress.

   The original prototype passed the inventory from scene to scene inside
   gotoScene(). That works for items, but it gets awkward once you also
   have gold, quest flags, crops growing on a timer, and ore veins that
   refill while you are somewhere else. So instead there is one global
   object that every room talks to, and it saves itself to localStorage.

   Anything you want to survive a room change goes in here.
   ===================================================================== */

const SAVE_KEY = 'green-adventurer-save-v1';
const STARTING_PLOTS = 4;
const ORE_VEIN_COUNT = 5;

const GameState = {

    gold: 0,
    inventory: {},        // itemId -> how many you are carrying
    flags: {},            // flagName -> true   (story progress lives here)
    plots: [],            // farm: [{ seed: itemId|null, plantedAt: timestamp }]
    veins: [],            // mine: [{ minedAt: timestamp }]
    selectedSeed: 'sproutSeed',
    endingsSeen: {},

    /* ---------- lifecycle ---------- */

    reset() {
        this.gold = 0;
        this.inventory = {};
        this.flags = {};
        this.selectedSeed = 'sproutSeed';

        this.plots = [];
        for (let i = 0; i < STARTING_PLOTS; i++) {
            this.plots.push({ seed: null, plantedAt: 0 });
        }

        this.veins = [];
        for (let i = 0; i < ORE_VEIN_COUNT; i++) {
            this.veins.push({ minedAt: 0 });
        }

        // endingsSeen deliberately survives a reset - it is your trophy shelf.
        this.save();
    },

    /* ---------- gold ---------- */

    earn(amount) {
        this.gold += amount;
        this.save();
        return this.gold;
    },

    canAfford(amount) {
        return this.gold >= amount;
    },

    spend(amount) {
        if (!this.canAfford(amount)) return false;
        this.gold -= amount;
        this.save();
        return true;
    },

    /* ---------- inventory ---------- */

    count(itemId) {
        return this.inventory[itemId] || 0;
    },

    has(itemId, howMany = 1) {
        return this.count(itemId) >= howMany;
    },

    add(itemId, howMany = 1) {
        this.inventory[itemId] = this.count(itemId) + howMany;
        this.save();
    },

    remove(itemId, howMany = 1) {
        const left = this.count(itemId) - howMany;
        if (left > 0) {
            this.inventory[itemId] = left;
        } else {
            delete this.inventory[itemId];
        }
        this.save();
    },

    /* Ordered list of what you are carrying, for the sidebar. */
    carrying() {
        return Object.keys(this.inventory)
            .filter(id => this.inventory[id] > 0)
            .sort((a, b) => (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b));
    },

    /* ---------- story flags ---------- */

    setFlag(name, value = true) {
        this.flags[name] = value;
        this.save();
    },

    hasFlag(name) {
        return !!this.flags[name];
    },

    /* ---------- farm ---------- */

    /* The watering can is a permanent upgrade, so growth speed is a
       property of the save file rather than of any single plot. */
    growthMultiplier() {
        return this.has('wateringCan') ? 0.5 : 1;
    },

    harvestMultiplier() {
        return this.has('goldenTrowel') ? 2 : 1;
    },

    addPlots(howMany) {
        for (let i = 0; i < howMany; i++) {
            this.plots.push({ seed: null, plantedAt: 0 });
        }
        this.save();
    },

    /* ---------- mine ---------- */

    oreMultiplier() {
        return this.has('sturdyPick') ? 1.5 : 1;
    },

    /* ---------- persistence ---------- */

    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                gold: this.gold,
                inventory: this.inventory,
                flags: this.flags,
                plots: this.plots,
                veins: this.veins,
                selectedSeed: this.selectedSeed,
                endingsSeen: this.endingsSeen
            }));
        } catch (e) {
            // Private browsing, or opened straight off the filesystem in a
            // browser that blocks storage. The game still plays fine, it just
            // will not remember you.
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.gold = data.gold || 0;
            this.inventory = data.inventory || {};
            this.flags = data.flags || {};
            this.plots = data.plots && data.plots.length ? data.plots : [];
            this.veins = data.veins && data.veins.length ? data.veins : [];
            this.selectedSeed = data.selectedSeed || 'sproutSeed';
            this.endingsSeen = data.endingsSeen || {};

            // Older saves might predate a feature - top the arrays back up.
            while (this.plots.length < STARTING_PLOTS) this.plots.push({ seed: null, plantedAt: 0 });
            while (this.veins.length < ORE_VEIN_COUNT) this.veins.push({ minedAt: 0 });
            return true;
        } catch (e) {
            return false;
        }
    },

    hasSave() {
        try {
            return !!localStorage.getItem(SAVE_KEY);
        } catch (e) {
            return false;
        }
    }
};
