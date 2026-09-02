/* =====================================================================
   Every item in the game, in one table.

   Want to rebalance the economy? Change the numbers here and nothing
   else - the shop, the farm, the mine and the sidebar all read from this
   file.

   Fields:
     icon         emoji shown in the sidebar and the shop
     name         display name
     blurb        the line Wren says when you hover it in the shop
     price        cost in the shop. Leave it out and it is not for sale.
     sellPrice    what Wren pays for it. Leave it out and she will not buy.
     showIf       optional () => bool, gates the item behind story progress
     onBuy        optional (scene) => void, for things that act immediately
     plantable    true if it can go in a farm plot
     growMs       how long it takes to grow (before the watering can)
     harvestGold  gold you get for harvesting it
     harvestItem  item you get for harvesting it
   ===================================================================== */

const ITEMS = {

    /* ---------- seeds and crops ---------- */

    sproutSeed: {
        icon: '🌱',
        name: 'Sprout Seed',
        blurb: 'Grows fast, sells quick. The backbone of any honest purse.',
        price: 5,
        plantable: true,
        growMs: 12000,
        harvestGold: 12
    },

    sunblossomSeed: {
        icon: '🌻',
        name: 'Sunblossom Seed',
        blurb: 'Slow, fussy, and the only flower that still remembers summer.',
        price: 35,
        plantable: true,
        growMs: 25000,
        harvestItem: 'sunblossom'
    },

    sunblossom: {
        icon: '🌼',
        name: 'Sunblossom',
        blurb: 'Warm to the touch. Mira wants three of them.'
    },

    /* ---------- farm tools ---------- */

    gardenGlove: {
        icon: '🧤',
        name: "Gardener's Glove",
        blurb: 'Old leather, green at the seams. Elder Maple gave you this.'
    },

    wateringCan: {
        icon: '💧',
        name: 'Watering Can',
        blurb: 'Crops grow in half the time. Pays for itself by lunch.',
        price: 45,
        showIf: () => GameState.has('gardenGlove')
    },

    goldenTrowel: {
        icon: '🥄',
        name: 'Golden Trowel',
        blurb: 'Doubles the gold from every harvest. Gaudy, but it works.',
        price: 90,
        showIf: () => GameState.has('gardenGlove')
    },

    plotDeed: {
        icon: '🪧',
        name: 'Deed for Two Plots',
        blurb: 'Signed, sealed, and two more rows of dirt are yours.',
        price: 80,
        showIf: () => GameState.has('gardenGlove'),
        onBuy: (scene) => {
            GameState.addPlots(2);
            scene.showMessage('Two more plots are yours. Tussock will be thrilled.');
        }
    },

    /* ---------- mining ---------- */

    pickaxe: {
        icon: '⛏️',
        name: 'Pickaxe',
        blurb: 'Bram will not let you down the Glimmerdeep without one.',
        price: 60
    },

    sturdyPick: {
        icon: '🔨',
        name: 'Sturdy Pick',
        blurb: 'Half again as much ore from every swing.',
        price: 120,
        showIf: () => GameState.has('pickaxe')
    },

    gemstone: {
        icon: '💎',
        name: 'Raw Gemstone',
        blurb: 'Cloudy, uncut, and worth a week of turnips.',
        sellPrice: 25
    },

    /* ---------- adventuring gear ---------- */

    rope: {
        icon: '🪢',
        name: 'Coil of Rope',
        blurb: 'Long enough for the watchtower. Probably.',
        price: 30
    },

    lantern: {
        icon: '🏮',
        name: 'Lantern',
        blurb: 'Burns steady. You will want it before you go under the woods.',
        price: 75
    },

    silverCharm: {
        icon: '🧿',
        name: 'Silver Charm',
        blurb: 'Kept under the counter. The Grey cannot hold what silver touches.',
        price: 150,
        showIf: () => GameState.hasFlag('metElder')
    },

    /* ---------- story items ---------- */

    sunlightElixir: {
        icon: '🧪',
        name: 'Sunlight Elixir',
        blurb: 'A whole afternoon in June, corked in glass.'
    },

    heartseed: {
        icon: '🌰',
        name: 'Heartseed',
        blurb: 'It is warm, and it is beating, very slowly.'
    },

    skyShard: {
        icon: '💫',
        name: 'Sky Shard',
        blurb: 'A piece of a star that fell before the valley had a name.'
    }
};

/* The order Wren lays her stock out in. Anything with a price can go here. */
const SHOP_STOCK = [
    'sproutSeed',
    'sunblossomSeed',
    'wateringCan',
    'goldenTrowel',
    'plotDeed',
    'pickaxe',
    'sturdyPick',
    'rope',
    'lantern',
    'silverCharm'
];

/* ---------- small helpers used all over the place ---------- */

function itemName(id) {
    return ITEMS[id] ? ITEMS[id].name : id;
}

function itemIcon(id) {
    return ITEMS[id] ? ITEMS[id].icon : '❔';
}

function itemLabel(id) {
    return `${itemIcon(id)} ${itemName(id)}`;
}

/* Is this item visible in the shop right now? */
function itemAvailable(id) {
    const item = ITEMS[id];
    if (!item || item.price === undefined) return false;
    return item.showIf ? item.showIf() : true;
}
