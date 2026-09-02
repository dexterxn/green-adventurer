/* =====================================================================
   Room backgrounds, drawn with shapes instead of image files.

   The original prototype loaded a .jpg per room. This version paints
   everything with Phaser graphics instead, which means the repo has no
   binary assets to lose track of and you can restyle a room by changing
   two numbers.

   Coordinates are fractions of the play area, not pixels:
       0, 0   = top-left of the picture
       1, 1   = bottom-right of the picture
   The picture is the left 75% of the canvas - the right quarter is the
   sidebar, and the painter never draws into it.

   To restyle a room, scroll to ROOM_ART at the bottom of this file.
   ===================================================================== */

class Painter {

    /* widthFraction is how much of the canvas the picture covers. Rooms
       use the default 0.75 and leave room for the sidebar; the title and
       ending screens pass 1 and use the whole thing. */
    constructor(scene, seed, widthFraction = 0.75) {
        this.scene = scene;
        this.w = scene.w * widthFraction;
        this.h = scene.h;
        this.g = scene.add.graphics().setDepth(-100);
        // Seeded so a room looks identical every time you walk back into it.
        this.rnd = new Phaser.Math.RandomDataGenerator([seed || 'green-adventurer']);
    }

    X(f) { return f * this.w; }
    Y(f) { return f * this.h; }

    /* ---------- sky and light ---------- */

    /* A vertical gradient, faked with a stack of thin bands. */
    sky(topColor, bottomColor, downTo = 1) {
        const bands = 64;
        const top = Phaser.Display.Color.IntegerToColor(topColor);
        const bottom = Phaser.Display.Color.IntegerToColor(bottomColor);
        const height = this.Y(downTo);
        for (let i = 0; i < bands; i++) {
            const mix = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
            this.g.fillStyle(Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b), 1);
            this.g.fillRect(0, (height / bands) * i, this.w, height / bands + 2);
        }
        return this;
    }

    /* A flat colour over the whole picture - for interiors. */
    wall(color) {
        this.g.fillStyle(color, 1);
        this.g.fillRect(0, 0, this.w, this.h);
        return this;
    }

    sun(x, y, radius = 0.05, color = 0xfff2b8) {
        this.g.fillStyle(color, 0.25);
        this.g.fillCircle(this.X(x), this.Y(y), this.h * radius * 2.2);
        this.g.fillStyle(color, 1);
        this.g.fillCircle(this.X(x), this.Y(y), this.h * radius);
        return this;
    }

    moon(x, y, radius = 0.045, color = 0xe8eef5) {
        this.g.fillStyle(color, 0.18);
        this.g.fillCircle(this.X(x), this.Y(y), this.h * radius * 2.4);
        this.g.fillStyle(color, 1);
        this.g.fillCircle(this.X(x), this.Y(y), this.h * radius);
        return this;
    }

    stars(count = 60, color = 0xffffff, aboveY = 0.6) {
        for (let i = 0; i < count; i++) {
            const x = this.rnd.frac() * this.w;
            const y = this.rnd.frac() * this.Y(aboveY);
            this.g.fillStyle(color, this.rnd.realInRange(0.3, 1));
            this.g.fillCircle(x, y, this.rnd.realInRange(1.5, 4));
        }
        return this;
    }

    /* A shaft of light falling from above - narrow at the top, wide below. */
    beam(x, topY, bottomY, topWidth, bottomWidth, color = 0xffe9a8, alpha = 0.14) {
        this.g.fillStyle(color, alpha);
        this.g.fillPoints([
            { x: this.X(x - topWidth / 2), y: this.Y(topY) },
            { x: this.X(x + topWidth / 2), y: this.Y(topY) },
            { x: this.X(x + bottomWidth / 2), y: this.Y(bottomY) },
            { x: this.X(x - bottomWidth / 2), y: this.Y(bottomY) }
        ], true);
        return this;
    }

    /* ---------- land ---------- */

    hills(y, color, count = 4, height = 0.16, alpha = 1) {
        this.g.fillStyle(color, alpha);
        for (let i = 0; i < count; i++) {
            const cx = this.w * ((i + 0.5) / count) + this.rnd.realInRange(-0.06, 0.06) * this.w;
            const rx = this.w * this.rnd.realInRange(0.18, 0.32);
            const ry = this.h * height * this.rnd.realInRange(0.7, 1.3);
            this.g.fillEllipse(cx, this.Y(y), rx * 2, ry * 2);
        }
        return this;
    }

    ground(y, color) {
        this.g.fillStyle(color, 1);
        this.g.fillRect(0, this.Y(y), this.w, this.h - this.Y(y));
        return this;
    }

    /* A horizontal band, for water, floorboards, a road. */
    strip(fromY, toY, color, alpha = 1) {
        this.g.fillStyle(color, alpha);
        this.g.fillRect(0, this.Y(fromY), this.w, this.Y(toY) - this.Y(fromY));
        return this;
    }

    /* A road running away from the viewer. */
    path(fromY, toY, widthNear, widthFar, color, centre = 0.5) {
        this.g.fillStyle(color, 1);
        this.g.fillPoints([
            { x: this.X(centre - widthFar / 2), y: this.Y(fromY) },
            { x: this.X(centre + widthFar / 2), y: this.Y(fromY) },
            { x: this.X(centre + widthNear / 2), y: this.Y(toY) },
            { x: this.X(centre - widthNear / 2), y: this.Y(toY) }
        ], true);
        return this;
    }

    /* Ploughed rows of soil. */
    furrows(fromY, toY, rows, color) {
        this.g.fillStyle(color, 1);
        const step = (this.Y(toY) - this.Y(fromY)) / rows;
        for (let i = 0; i < rows; i++) {
            this.g.fillRect(0, this.Y(fromY) + i * step, this.w, step * 0.45);
        }
        return this;
    }

    /* ---------- things that stand on the land ---------- */

    tree(x, baseY, scale = 1, trunkColor = 0x6b4a2f, leafColor = 0x4f8f3f) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const unit = this.h * 0.09 * scale;

        this.g.fillStyle(trunkColor, 1);
        this.g.fillRect(px - unit * 0.16, py - unit * 1.6, unit * 0.32, unit * 1.6);

        this.g.fillStyle(leafColor, 1);
        this.g.fillCircle(px, py - unit * 2.0, unit * 0.85);
        this.g.fillCircle(px - unit * 0.6, py - unit * 1.6, unit * 0.6);
        this.g.fillCircle(px + unit * 0.6, py - unit * 1.65, unit * 0.62);
        this.g.fillCircle(px, py - unit * 2.6, unit * 0.55);
        return this;
    }

    /* A bare, blighted tree - branches and no leaves. */
    deadTree(x, baseY, scale = 1, color = 0x5d564a) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const unit = this.h * 0.09 * scale;

        this.g.fillStyle(color, 1);
        this.g.fillRect(px - unit * 0.22, py - unit * 2.2, unit * 0.44, unit * 2.2);
        for (const dir of [-1, 1]) {
            this.g.fillTriangle(
                px, py - unit * 1.9,
                px + dir * unit * 1.1, py - unit * 2.9,
                px + dir * unit * 0.15, py - unit * 1.5
            );
            this.g.fillTriangle(
                px, py - unit * 2.4,
                px + dir * unit * 0.75, py - unit * 3.3,
                px + dir * unit * 0.1, py - unit * 2.1
            );
        }
        return this;
    }

    pine(x, baseY, scale = 1, color = 0x2f5c39, trunkColor = 0x4a3524) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const unit = this.h * 0.09 * scale;

        this.g.fillStyle(trunkColor, 1);
        this.g.fillRect(px - unit * 0.1, py - unit * 0.5, unit * 0.2, unit * 0.5);

        this.g.fillStyle(color, 1);
        for (let i = 0; i < 3; i++) {
            const top = py - unit * (1.0 + i * 0.75) - unit * 1.1;
            const spread = unit * (0.95 - i * 0.2);
            this.g.fillTriangle(px, top, px - spread, top + unit * 1.2, px + spread, top + unit * 1.2);
        }
        return this;
    }

    rock(x, baseY, scale = 1, color = 0x7b7468) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const unit = this.h * 0.05 * scale;
        this.g.fillStyle(color, 1);
        this.g.fillEllipse(px, py, unit * 2.2, unit * 1.4);
        this.g.fillEllipse(px - unit * 0.6, py + unit * 0.2, unit * 1.3, unit * 0.9);
        return this;
    }

    house(x, baseY, width, wallColor = 0xc9a877, roofColor = 0x8f4a3c, doorColor = 0x5a3a24) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const w = this.X(width);
        const h = w * 0.85;

        this.g.fillStyle(wallColor, 1);
        this.g.fillRect(px - w / 2, py - h, w, h);

        this.g.fillStyle(roofColor, 1);
        this.g.fillTriangle(px - w * 0.62, py - h, px + w * 0.62, py - h, px, py - h * 1.75);

        this.g.fillStyle(doorColor, 1);
        this.g.fillRect(px - w * 0.11, py - h * 0.5, w * 0.22, h * 0.5);

        this.g.fillStyle(0xffe9a0, 0.9);
        this.g.fillRect(px - w * 0.36, py - h * 0.78, w * 0.16, h * 0.2);
        this.g.fillRect(px + w * 0.2, py - h * 0.78, w * 0.16, h * 0.2);
        return this;
    }

    /* A market stall with a striped awning. */
    stall(x, baseY, width, postColor = 0x6b4a2f, awningColor = 0xc4553f) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const w = this.X(width);

        this.g.fillStyle(postColor, 1);
        this.g.fillRect(px - w / 2, py - w * 0.75, w * 0.06, w * 0.75);
        this.g.fillRect(px + w / 2 - w * 0.06, py - w * 0.75, w * 0.06, w * 0.75);
        this.g.fillRect(px - w / 2, py - w * 0.28, w, w * 0.08);

        this.g.fillStyle(awningColor, 1);
        this.g.fillRect(px - w * 0.58, py - w * 0.92, w * 1.16, w * 0.18);
        this.g.fillStyle(0xf2e4c6, 1);
        for (let i = 0; i < 4; i++) {
            this.g.fillRect(px - w * 0.58 + i * w * 0.29, py - w * 0.92, w * 0.145, w * 0.18);
        }
        return this;
    }

    /* A cave mouth or a doorway. */
    arch(x, baseY, width, height, color = 0x1a1512) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const w = this.X(width);
        const h = this.Y(height);
        this.g.fillStyle(color, 1);
        this.g.fillRect(px - w / 2, py - h * 0.6, w, h * 0.6);
        this.g.fillEllipse(px, py - h * 0.6, w, h * 0.8);
        return this;
    }

    pillar(x, topY, baseY, width, color = 0x4a4a44) {
        const px = this.X(x);
        const w = this.X(width);
        this.g.fillStyle(color, 1);
        this.g.fillRect(px - w / 2, this.Y(topY), w, this.Y(baseY) - this.Y(topY));
        this.g.fillRect(px - w * 0.75, this.Y(topY), w * 1.5, this.Y(0.03));
        this.g.fillRect(px - w * 0.75, this.Y(baseY) - this.Y(0.03), w * 1.5, this.Y(0.03));
        return this;
    }

    /* A tall ruined tower, missing its top. */
    tower(x, baseY, width, height, color = 0x4b4550) {
        const px = this.X(x);
        const py = this.Y(baseY);
        const w = this.X(width);
        const h = this.Y(height);

        this.g.fillStyle(color, 1);
        this.g.fillRect(px - w / 2, py - h, w, h);
        // Broken crenellations along the top.
        for (let i = 0; i < 5; i++) {
            if (i === 2) continue;
            this.g.fillRect(px - w / 2 + i * (w / 5), py - h - this.Y(0.03), w / 6, this.Y(0.03));
        }
        this.g.fillStyle(0x1d1a20, 1);
        for (let i = 0; i < 3; i++) {
            this.g.fillRect(px - w * 0.12, py - h * (0.85 - i * 0.28), w * 0.24, h * 0.12);
        }
        return this;
    }

    fence(baseY, fromX, toX, color = 0x6b5136) {
        const py = this.Y(baseY);
        const posts = 12;
        this.g.fillStyle(color, 1);
        this.g.fillRect(this.X(fromX), py - this.Y(0.035), this.X(toX - fromX), this.Y(0.008));
        for (let i = 0; i <= posts; i++) {
            const px = this.X(fromX + (toX - fromX) * (i / posts));
            this.g.fillRect(px, py - this.Y(0.06), this.X(0.006), this.Y(0.06));
        }
        return this;
    }

    windowPane(x, y, width, height, color = 0xffe9a0) {
        this.g.fillStyle(color, 0.85);
        this.g.fillRect(this.X(x), this.Y(y), this.X(width), this.Y(height));
        return this;
    }

    /* Low-lying fog. */
    mist(y, color = 0xcfe3e0, alpha = 0.12, bands = 5) {
        for (let i = 0; i < bands; i++) {
            this.g.fillStyle(color, alpha);
            this.g.fillEllipse(
                this.rnd.frac() * this.w,
                this.Y(y) + this.rnd.realInRange(-0.05, 0.08) * this.h,
                this.w * this.rnd.realInRange(0.4, 0.8),
                this.h * this.rnd.realInRange(0.05, 0.12)
            );
        }
        return this;
    }

    /* Darkens the edges so the middle of the room reads first. */
    vignette(alpha = 0.35, color = 0x000000) {
        const steps = 8;
        for (let i = 0; i < steps; i++) {
            this.g.fillStyle(color, alpha / steps);
            const inset = (i / steps) * this.w * 0.16;
            this.g.fillRect(0, 0, inset, this.h);
            this.g.fillRect(this.w - inset, 0, inset, this.h);
            this.g.fillRect(0, 0, this.w, inset * 0.7);
            this.g.fillRect(0, this.h - inset * 0.7, this.w, inset * 0.7);
        }
        return this;
    }

    /* Scattered glints - crystals in a mine, fireflies in a wood. */
    sparkle(count, color, fromY = 0, toY = 1, size = 5) {
        for (let i = 0; i < count; i++) {
            this.g.fillStyle(color, this.rnd.realInRange(0.4, 1));
            this.g.fillCircle(
                this.rnd.frac() * this.w,
                this.Y(fromY) + this.rnd.frac() * (this.Y(toY) - this.Y(fromY)),
                this.rnd.realInRange(size * 0.4, size)
            );
        }
        return this;
    }
}


/* =====================================================================
   THE ROOMS

   One entry per scene key. Each is a little painting script.
   Reorder the calls to change what sits in front of what.
   ===================================================================== */

const ROOM_ART = {

    village(p) {
        p.sky(0x7ec0e0, 0xe6f3d2);
        p.sun(0.82, 0.14);
        p.hills(0.70, 0x86ad6b, 4, 0.14);
        p.hills(0.74, 0x6f9a56, 3, 0.11);
        p.ground(0.76, 0x76a04f);
        p.path(0.76, 1.0, 0.5, 0.12, 0xc4a878, 0.4);
        p.house(0.14, 0.80, 0.20, 0xd8bb8c, 0x8f4a3c);
        p.house(0.70, 0.78, 0.16, 0xcbae82, 0x7a5140);
        p.tree(0.42, 0.79, 0.9);
        p.tree(0.90, 0.84, 1.1);
        p.fence(0.86, 0.55, 0.98);
    },

    market(p) {
        p.sky(0x8ec9e4, 0xf6ead0);
        p.sun(0.18, 0.12);
        p.hills(0.68, 0x8aab74, 3, 0.10);
        p.ground(0.72, 0xc0a37a);
        p.strip(0.72, 0.76, 0xa88b64);
        p.stall(0.20, 0.80, 0.22, 0x6b4a2f, 0xc4553f);
        p.stall(0.52, 0.78, 0.19, 0x6b4a2f, 0x3f7bc4);
        p.stall(0.83, 0.82, 0.21, 0x6b4a2f, 0x4aa05a);
        p.tree(0.68, 0.72, 0.55);
    },

    farm(p) {
        p.sky(0x9ad4ee, 0xf2f7d6);
        p.sun(0.14, 0.14);
        p.hills(0.42, 0x7fa863, 4, 0.09);
        p.ground(0.46, 0x76a04f);          // grass strip the buildings sit on
        p.ground(0.56, 0x8f7048);          // tilled soil, where the plots go
        p.furrows(0.58, 1.0, 9, 0x7a5c39);
        p.house(0.88, 0.56, 0.22, 0xb4553f, 0x7a3a2c);
        p.tree(0.06, 0.56, 0.8);
        p.fence(0.56, 0.14, 0.74);
    },

    alchemist(p) {
        p.wall(0x3b3048);
        p.strip(0.0, 0.06, 0x2a2136);
        p.floor(0.78, 0x2e2739);
        p.windowPane(0.06, 0.14, 0.14, 0.20, 0x8fd6c4);
        p.windowPane(0.80, 0.14, 0.14, 0.20, 0x8fd6c4);
        p.beam(0.13, 0.34, 0.80, 0.14, 0.34, 0x9fe6cf, 0.10);
        p.beam(0.87, 0.34, 0.80, 0.14, 0.34, 0x9fe6cf, 0.10);
        // Shelves of bottles.
        for (let row = 0; row < 3; row++) {
            p.g.fillStyle(0x5a4436, 1);
            p.g.fillRect(p.X(0.28), p.Y(0.22 + row * 0.15), p.X(0.44), p.Y(0.018));
            for (let i = 0; i < 7; i++) {
                p.g.fillStyle(p.rnd.pick([0x7ad4a8, 0xd47ab0, 0xd4c07a, 0x7aa8d4, 0xb47ad4]), 0.9);
                p.g.fillRect(p.X(0.30 + i * 0.06), p.Y(0.17 + row * 0.15), p.X(0.026), p.Y(0.05));
            }
        }
        p.vignette(0.4);
    },

    ridge(p) {
        p.sky(0x8ba1ad, 0xd9d3c2);
        p.hills(0.58, 0x6f7a78, 3, 0.18);
        p.hills(0.66, 0x5c6664, 4, 0.14);
        p.ground(0.72, 0x847a6a);
        p.arch(0.22, 0.86, 0.20, 0.34, 0x18140f);
        p.rock(0.55, 0.84, 1.4);
        p.rock(0.78, 0.90, 1.9, 0x6e675c);
        p.rock(0.94, 0.80, 1.0);
        p.pine(0.66, 0.74, 0.6, 0x3f5c46);
    },

    mine(p) {
        p.wall(0x241d18);
        p.arch(0.5, 1.15, 1.4, 0.95, 0x120e0b);
        p.floor(0.80, 0x1a1512);
        p.pillar(0.14, 0.10, 0.82, 0.035, 0x4a3826);
        p.pillar(0.86, 0.10, 0.82, 0.035, 0x4a3826);
        p.g.fillStyle(0x4a3826, 1);
        p.g.fillRect(0, p.Y(0.08), p.w, p.Y(0.035));
        p.sparkle(40, 0x7fe4d8, 0.15, 0.78, 6);
        p.beam(0.5, 0.08, 0.85, 0.10, 0.5, 0xffd88a, 0.07);
        p.vignette(0.55);
    },

    watchtower(p) {
        p.sky(0x3f4f8c, 0xe8975c);
        p.stars(70, 0xffffff, 0.55);
        p.moon(0.22, 0.18, 0.05);
        p.hills(0.74, 0x39405c, 4, 0.14);
        p.ground(0.80, 0x2b3049);
        p.tower(0.55, 0.82, 0.22, 0.72, 0x413b4a);
        p.pine(0.12, 0.84, 0.9, 0x232a3a, 0x1a1f2b);
        p.pine(0.90, 0.88, 1.1, 0x232a3a, 0x1a1f2b);
        p.vignette(0.3);
    },

    woods(p) {
        p.sky(0x3f5f45, 0x9bbd7c);
        p.beam(0.35, 0.0, 0.9, 0.06, 0.28, 0xdff0b8, 0.10);
        p.beam(0.72, 0.0, 0.9, 0.05, 0.22, 0xdff0b8, 0.08);
        p.hills(0.68, 0x40613f, 4, 0.13);
        p.ground(0.76, 0x4d6b3c);
        p.pine(0.05, 0.80, 1.5);
        p.pine(0.20, 0.86, 1.9, 0x27502f);
        p.pine(0.84, 0.84, 1.7, 0x27502f);
        p.pine(0.97, 0.80, 1.4);
        p.pine(0.62, 0.74, 0.9, 0x35633c);
        p.mist(0.82, 0xcfe3c0, 0.10);
        p.vignette(0.35);
    },

    hollow(p) {
        p.wall(0x14201d);
        p.strip(0.0, 0.10, 0x0d1614);
        p.pillar(0.10, 0.06, 0.78, 0.045, 0x2c3a35);
        p.pillar(0.30, 0.06, 0.78, 0.045, 0x2c3a35);
        p.pillar(0.70, 0.06, 0.78, 0.045, 0x2c3a35);
        p.pillar(0.90, 0.06, 0.78, 0.045, 0x2c3a35);
        p.arch(0.5, 0.72, 0.26, 0.42, 0x0a100e);
        p.floor(0.78, 0x101a17);
        p.strip(0.86, 1.0, 0x16302c, 0.8);      // standing water
        p.beam(0.5, 0.06, 0.80, 0.08, 0.36, 0x86d8c0, 0.09);
        p.sparkle(22, 0x9fe8d4, 0.30, 0.76, 4);
        p.mist(0.84, 0x86d8c0, 0.07);
        p.vignette(0.6);
    },

    grove(p) {
        // Everything here is drained of colour. That is the point.
        p.sky(0x9a9c96, 0xd2cec1);
        p.hills(0.72, 0x84867d, 4, 0.13);
        p.ground(0.78, 0x6f6f62);
        p.deadTree(0.50, 0.82, 3.4, 0x5b5449);
        p.deadTree(0.12, 0.86, 1.1, 0x645d51);
        p.deadTree(0.90, 0.88, 1.3, 0x645d51);
        p.rock(0.30, 0.92, 1.1, 0x7a776b);
        p.rock(0.72, 0.94, 1.3, 0x7a776b);
        p.mist(0.88, 0xbdbdb0, 0.14);
        p.vignette(0.3);
    },

    /* ---------- full-width screens (title and endings) ---------- */

    title(p) {
        p.sky(0x1d2b3f, 0x4a6b52);
        p.stars(90, 0xdfe8ff, 0.6);
        p.moon(0.78, 0.20, 0.045);
        p.hills(0.78, 0x22331f, 4, 0.15);
        p.ground(0.86, 0x18240f);
        p.pine(0.08, 0.92, 1.8, 0x142012, 0x101a0e);
        p.pine(0.22, 0.96, 2.2, 0x0f1a0d, 0x0c150a);
        p.pine(0.86, 0.94, 2.0, 0x142012, 0x101a0e);
        p.deadTree(0.5, 0.90, 2.6, 0x2a3325);
        p.mist(0.90, 0x9fd8b0, 0.07);
        p.vignette(0.45);
    },

    endingBloom(p) {
        p.sky(0x74c4ea, 0xf2f8d4);
        p.sun(0.80, 0.16, 0.06);
        p.hills(0.72, 0x74a85c, 4, 0.14);
        p.ground(0.80, 0x6ea24a);
        p.tree(0.50, 0.86, 3.2, 0x6b4a2f, 0x54a441);
        p.tree(0.14, 0.90, 1.0);
        p.tree(0.88, 0.92, 1.2);
        p.sparkle(40, 0xfff2a8, 0.20, 0.80, 6);
    },

    endingGreenStar(p) {
        p.sky(0x0f1a3a, 0x2e5b4a);
        p.stars(140, 0xffffff, 0.7);
        p.moon(0.18, 0.16, 0.05);
        p.hills(0.76, 0x1c3327, 4, 0.14);
        p.ground(0.84, 0x16281d);
        p.tree(0.50, 0.90, 3.2, 0x2f2418, 0x2f6b46);
        p.sparkle(90, 0x9fffcf, 0.10, 0.85, 7);
        p.beam(0.5, 0.0, 0.90, 0.04, 0.30, 0x9fffcf, 0.10);
    },

    endingGilded(p) {
        p.sky(0x6a4a7a, 0xf0a860);
        p.sun(0.72, 0.66, 0.08, 0xffc86a);
        p.hills(0.70, 0x4a3a4a, 4, 0.13);
        p.ground(0.76, 0x3f3340);
        p.path(0.76, 1.0, 0.55, 0.10, 0xa4885c, 0.45);
        p.deadTree(0.14, 0.84, 1.6, 0x2e2632);
        p.deadTree(0.90, 0.88, 1.4, 0x2e2632);
        p.sparkle(50, 0xffd97a, 0.55, 0.95, 6);
        p.vignette(0.4);
    },

    endingGrafting(p) {
        p.sky(0x6f8fc4, 0xf2c98a);
        p.sun(0.20, 0.72, 0.07, 0xffd9a0);
        p.hills(0.70, 0x6a7f5c, 3, 0.11);
        p.ground(0.74, 0x8a7048);
        p.furrows(0.76, 1.0, 6, 0x74593a);
        p.tree(0.52, 0.86, 1.1, 0x6b4a2f, 0x5aa447);
        p.house(0.86, 0.74, 0.20, 0xb4553f, 0x7a3a2c);
        p.fence(0.74, 0.0, 0.70);
    },

    endingWithering(p) {
        p.wall(0x14150f);
        p.sky(0x2a2c24, 0x4a4a3c, 0.7);
        p.hills(0.68, 0x2b2c24, 4, 0.14);
        p.ground(0.74, 0x24251d);
        p.deadTree(0.5, 0.84, 3.0, 0x3a3a30);
        p.deadTree(0.16, 0.88, 1.2, 0x33342b);
        p.deadTree(0.84, 0.90, 1.4, 0x33342b);
        p.mist(0.86, 0x6a7a6a, 0.10);
        p.vignette(0.7);
    }
};

/* Painter.floor is used above but reads better than strip() at the call
   site, so it is aliased here rather than duplicated in the class. */
Painter.prototype.floor = function (y, color) {
    return this.ground(y, color);
};

/* Called by AdventureScene before anything else is drawn.
   Title and ending screens pass widthFraction 1 to use the full canvas. */
function paintRoom(scene, key, widthFraction = 0.75) {
    const recipe = ROOM_ART[key];
    if (!recipe) {
        // No art defined yet - a flat colour is better than a black box.
        new Painter(scene, key, widthFraction).wall(0x3d4438);
        return;
    }
    recipe(new Painter(scene, key, widthFraction));
}
