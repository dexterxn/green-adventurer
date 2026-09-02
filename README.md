# Green Adventurer

A point-and-click adventure game in Phaser 3. The valley of Willowbrook is going
grey, the Heartwood at its centre is blighted, and you are the last of a small
order of wandering gardeners. Ten rooms, nine characters, a farm, a mine, a
shop, and five different endings.

**Play it:** open `index.html` in a browser. No build step, no install, no
server required — it runs straight off the filesystem.

## The game

You start with nothing. Elder Maple gives you twelve gold and a glove, and from
there the loop is:

1. **Make money.** Sow seeds in the Verdant Plot and harvest them, or buy a
   pickaxe and work the seams in the Glimmerdeep. Crops and ore seams both run
   on real timestamps, so they keep growing and refilling while you are in
   another room.
2. **Spend it.** Wren's stall sells seed, tools, upgrades, a lantern, a rope,
   and one silver charm she keeps under the counter.
3. **Finish the story.** Grow three Sunblossoms, have Mira brew them into the
   Sunlight Elixir, buy silver, go down into the Sunken Hollow, and take the
   Heartseed off the Grey Wraith. Then decide what to do with it.

### The five endings

| Ending | How you get there |
| --- | --- |
| **The Bloom** | Plant the Heartseed at the Heartwood and pour the Elixir over it. |
| **The Green Star** | The same, but carrying the Sky Shard from the watchtower. |
| **The Gilded Road** | Sell the Heartseed to Rilla the fox for 500 gold. |
| **The Quiet Grafting** | Plant the Heartseed on your own farm instead. |
| **The Withering** | Open the reliquary with no silver on you, or give up at the trunk. |

Endings you have found are remembered on the title screen, and they survive a
reset. Progress otherwise saves to `localStorage` automatically.

### The map

```
                    [Ruined Watchtower]
                             |
   [Stony Ridge] ----- [Market Square] ----- [Whispering Woods] --- [Heartwood Grove]
        |                    |                        |
  [The Glimmerdeep]  [Willowbrook Village]     [The Sunken Hollow]
                        /         \
            [The Verdant Plot]  [Mira's Hut]
```

## How the project is laid out

The whole point of this structure is that each room is one file you can open
and edit on its own.

```
index.html                  loads everything, in order
css/style.css               the page around the canvas

js/lib/phaser.js            Phaser 3.60
js/state.js                 GameState: gold, inventory, flags, crops, ore, saving
js/adventure.js             AdventureScene, the base class every room extends
js/main.js                  Phaser config and the list of scenes

js/data/items.js            every item, price and growth rate in one table
js/data/quests.js           the quest log and the "what now?" hint
js/data/backgrounds.js      the Painter, and one art recipe per room

js/scenes/intro.js          title screen
js/scenes/village.js        Willowbrook Village   - hub, Elder Maple, noticeboard
js/scenes/market.js         Market Square         - the shop
js/scenes/farm.js           The Verdant Plot      - planting and harvesting
js/scenes/alchemist.js      Mira's Hut            - brewing the Elixir
js/scenes/ridge.js          Stony Ridge           - Bram, the way down
js/scenes/mine.js           The Glimmerdeep       - ore seams
js/scenes/watchtower.js     Ruined Watchtower     - the Sky Shard
js/scenes/woods.js          Whispering Woods      - Rilla, the coin toss
js/scenes/hollow.js         The Sunken Hollow     - Sister Bell, the Wraith
js/scenes/grove.js          Heartwood Grove       - the finale
js/scenes/endings.js        all five endings
```

> A note on the file split: these are separate **JavaScript** files rather than
> separate HTML files. Phaser runs the whole game on one canvas in one page, so
> a second HTML file would start a second game and lose your inventory. One
> file per room gives you the same "open the file, edit the room" workflow,
> which is what the split is for.

## Editing it

**Positions are fractions, not pixels.** `this.px(0.5), this.py(0.5)` is the
middle of the picture. The picture is the left 75% of the canvas; the sidebar
owns the rest. The background painter uses the same 0-to-1 coordinates, so a
prop and the art underneath it line up.

**Change the economy** — `js/data/items.js`. Prices, growth times and harvest
values are all in that one table. Mine payouts are the constants at the top of
`js/scenes/mine.js`.

**Add an item to the shop** — add it to `ITEMS`, give it a `price`, then add its
id to `SHOP_STOCK`. Add a `showIf` to hide it until some condition is met, or an
`onBuy` if it should do something immediately instead of going in your bag.

**Change how a room looks** — `js/data/backgrounds.js`, in `ROOM_ART`. Each room
is a short painting script (`p.sky(...)`, `p.hills(...)`, `p.house(...)`). There
are no image files anywhere in the project; every background is drawn from
shapes at runtime.

**Add a room** —

1. copy a file in `js/scenes/`, change the two strings in `super()`
2. add a `<script>` tag for it in `index.html`
3. add an art recipe in `ROOM_ART`, keyed by the scene key
4. add the class to the `scene:` list in `js/main.js`
5. point an `addExit()` at it from a room that already exists

**Useful helpers** on `AdventureScene`, all defined in `js/adventure.js`:

| Helper | What it does |
| --- | --- |
| `hotspot(x, y, text, opts)` | a clickable thing — everything in every room is one |
| `npc(x, y, emoji, opts)` | a person; `greeting` on hover, `lines` on click |
| `pickup(x, y, itemId)` | an item on the ground that goes in your bag |
| `addExit(dir, scene, caption, opts)` | an arrow out; `opts.locked` gates it |
| `speak(sprite, lines)` | several lines of dialogue in sequence |
| `showMessage(text)` | one line in the sidebar |
| `gainGold(n, x, y)` / `spendGold(n, x, y)` | money, with a floating number |
| `openOverlay()` / `overlayText()` / `closeOverlay()` | full-screen panels like the shop |

`greeting` and `lines` accept functions as well as strings, which is how
dialogue reacts to what you are carrying and how far along you are.

## Credits

Built on the `AdventureScene` pattern from UCSC CMPM 120. Phaser 3.60 is
vendored in `js/lib/` so the game runs offline.
