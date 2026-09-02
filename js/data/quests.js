/* =====================================================================
   The quest log, and the hint Elder Maple gives you when you are stuck.

   Both are just functions over GameState, so if you add a story beat you
   only have to describe it here - the noticeboard in the village and the
   elder's dialogue pick it up automatically.
   ===================================================================== */

/* Everything the player is meant to be doing, in rough order.
   Returns [{ done: bool, text: string }] */
function currentObjectives() {
    const seenEnding = Object.keys(GameState.endingsSeen).length > 0;

    return [
        {
            done: GameState.hasFlag('metElder'),
            text: 'Speak with Elder Maple by the well.'
        },
        {
            done: GameState.hasFlag('firstHarvest'),
            text: 'Work the Verdant Plot. Seed, water, wait, harvest.'
        },
        {
            done: GameState.has('sunlightElixir') || GameState.has('sunblossom', 3),
            text: 'Grow three Sunblossoms from the seeds Wren sells.'
        },
        {
            done: GameState.has('sunlightElixir'),
            text: 'Have Mira brew the Sunlight Elixir (3 Sunblossoms + 60 gold).'
        },
        {
            done: GameState.has('silverCharm') || GameState.hasFlag('tookHeartseed'),
            text: 'Buy the Silver Charm. Do not go under the woods without it.'
        },
        {
            done: GameState.hasFlag('enteredHollow'),
            text: 'Buy a Lantern and take the south path in the Whispering Woods.'
        },
        {
            done: GameState.hasFlag('tookHeartseed'),
            text: 'Take the Heartseed from the reliquary in the Sunken Hollow.'
        },
        {
            done: seenEnding,
            text: 'Bring what you have gathered to the Heartwood Grove.'
        }
    ];
}

/* Optional things worth doing that are not on the critical path. */
function sideObjectives() {
    return [
        {
            done: GameState.has('skyShard'),
            text: 'Rumour: something bright sits at the top of the Ruined Watchtower.'
        },
        {
            done: GameState.hasFlag('minedOre'),
            text: 'Rumour: Bram says the Glimmerdeep still pays, if you bring a pick.'
        }
    ];
}

/* One line of "here is what to do next", used by Elder Maple and Pip. */
function nextHint() {
    if (!GameState.hasFlag('metElder')) {
        return 'Talk to me properly, traveller. Click me again.';
    }
    if (!GameState.hasFlag('firstHarvest')) {
        return 'Coin first. South of the village there is dirt that will take a seed.';
    }
    if (!GameState.has('sunlightElixir') && !GameState.has('sunblossom', 3)) {
        return 'Mira needs three Sunblossoms. Wren sells the seed, but she prices it like a sin.';
    }
    if (!GameState.has('sunlightElixir')) {
        return 'Take your Sunblossoms east, to Mira. She will want sixty gold for the brewing.';
    }
    if (!GameState.has('silverCharm')) {
        return 'Wren keeps a silver charm under her counter. Buy it before you go under the woods.';
    }
    if (!GameState.hasFlag('tookHeartseed')) {
        return 'A lantern, and the south path in the Whispering Woods. Sister Bell will explain the rest.';
    }
    return 'You have everything. The Heartwood is east, past the woods. Go gently.';
}
