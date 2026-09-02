/* =====================================================================
   Boot.

   Every scene the game can reach has to be listed here. The first entry
   is the one that runs on load.

   Adding a room:
     1. copy an existing file in js/scenes/
     2. add a <script> tag for it in index.html
     3. add a background recipe in js/data/backgrounds.js (keyed by the
        scene key you passed to super())
     4. add the class to the list below
     5. point an addExit() at it from somewhere
   ===================================================================== */

const game = new Phaser.Game({
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    backgroundColor: '#0d120c',
    title: 'Green Adventurer',
    scene: [
        Intro,

        // Rooms
        Village,
        Market,
        Farm,
        Alchemist,
        Ridge,
        Mine,
        Watchtower,
        Woods,
        Hollow,
        Grove,

        // Endings
        EndingBloom,
        EndingGreenStar,
        EndingGilded,
        EndingGrafting,
        EndingWithering
    ]
});
