import { Map } from "./Map.js"
import { ArenaGen } from "./map_gen/ArenaGen.js"
import { MapGenerator } from "./map_gen/MapGenerator.js"
import { Ball } from "./Ball.js"
import { Vec2D } from "../geometry/Vec2D.js";
import { Collision } from "../geometry/Collision.js";
import { Rect } from "../geometry/Rect.js";
import { Faction } from "./Faction.js";

export class World {
    constructor(rows: number, cols: number, nFactions: number) {
        let gen: MapGenerator = new ArenaGen();
        this.map = gen.generate(rows, cols, nFactions);
        this.balls = new Array<Ball>();
        this.nFactions = nFactions;
    }

    update(t: number, dt: number) {
        this.spawn(t);
        const substeps = 1 << 4 - 1;
        dt /= substeps;
        for (let iter = 0; iter < substeps; iter++) {
            this.subUpdate(t + iter * dt, dt);
        }
    }

    subUpdate(t: number, dt: number) {
        let balls = this.balls;
        const bounds = new Vec2D(this.map.cols, this.map.rows);
        for (let i = 0; i < this.balls.length; i++) {
            let ball = balls[i];
            // if (ball.area > 1) {
            // ball.area *= 0.997;
            ball.speed = ball.speed.div(0.99);
            // }
            ball.update(dt, bounds);
        }

        this.checkCollisions();
        this.eraseDeadBalls();
    }

    private eraseDeadBalls() {
        let balls = this.balls;
        for (let i = 0; i < balls.length; i++) {
            let ball = balls[i];
            if (ball.isDead) {
                balls[i] = balls[balls.length - 1];
                balls.pop();
                i--;
            }
        }
    }

    private spawn(t: number) {
        let map = this.map;

        for (let row = 0; row < map.rows; row++) {
            for (let col = 0; col < map.cols; col++) {
                let tile = map.tiles[row][col];
                if (!tile.faction.isPlayer()) {
                    continue;
                }

                this.balls.push(new Ball(
                    0.1 / 2,
                    new Vec2D(col + 0.5, row + 0.5),
                    Vec2D.FromPolar(0.1 / 10, t / 500 * 2 * Math.PI + 555 * row + 777 * col),
                    // Vec2D.Random(0.1 / 10),
                    tile.faction,
                ));
            }
        }
    }

    private checkCollisions() {
        this.checkBallCollisions();
        this.checkBallsTilesCollisions();
    }

    private checkBallCollisions() {
        let balls = this.balls;
        balls.sort((a, b): number => (a.origin.x - a.radius < b.origin.x - b.radius) ? -1 : 1);

        let collisionChecks = 0;
        const lim = balls.length
        for (let i = 0; i < lim; i++) {
            let bi = balls[i];
            if (bi.isDead) {
                continue;
            }
            for (let j = i + 1; j < lim && bi.origin.x + bi.radius > balls[j].origin.x - balls[j].radius; j++) {
                collisionChecks++;
                let bj = balls[j];
                if (bj.isDead) {
                    continue;
                }
                if (!Collision.checkCircleCircle(bi, bj)) {
                    continue;
                }

                this.collideBalls(bi, bj);
            }
        }

        console.log(`Collision checks: ${collisionChecks}, balls count: ${balls.length}`);
    }

    private collideBalls(b1: Ball, b2: Ball) {
        if (b1.area < b2.area) {
            this.collideBalls(b2, b1);
            return;
        }
        b2.die();

        let p1 = b1.momentum;
        let p2 = b2.momentum;
        let p = p1.add(p2);

        if (b1.faction.equal(b2.faction)) {
            let m = b1.area + b2.area;

            let c1 = b1.origin.mul(b1.area);
            let c2 = b2.origin.mul(b2.area);
            let c = c1.add(c2).div(m);

            b1.area = m;
            b1.momentum = p;
            b1.origin = c;
        } else {
            b1.area -= b2.area;
            if (b1.isNegligible) {
                b1.die();
                return;
            }

            b1.momentum = p;
        }
    }

    private checkBallsTilesCollisions() {
        let balls = this.balls;

        for (let i = 0; i < balls.length; i++) {
            this.checkBallTilesCollision(balls[i]);
        }
    }

    private readonly captureCost: number = 1; // tile area

    private checkBallTilesCollision(ball: Ball) {
        let map = this.map;

        const rowMin = Math.max(0, Math.floor(ball.origin.y - ball.radius));
        if (rowMin === undefined) {
            debugger;
        }

        const rowMax = Math.min(map.rows - 1, Math.ceil(ball.origin.y + ball.radius));
        const colMin = Math.max(0, Math.floor(ball.origin.x - ball.radius));
        const colMax = Math.min(map.cols - 1, Math.ceil(ball.origin.x + ball.radius));
        // TODO? calc col min/max inside loop

        for (let row = rowMin; row <= rowMax; row++) {
            if (rowMin === undefined) {
                debugger;
            }
            for (let col = colMin; col <= colMax; col++) {
                if (rowMin === undefined) {
                    debugger;
                }
                let tileRect = this.getTileRect(col, row);
                if (!Collision.checkRectCircle(tileRect, ball)) {
                    continue;
                }

                if (rowMin === undefined) {
                    debugger;
                }
                let tile = map.tiles[row][col];
                switch (tile.faction.id) {
                    case Faction.Wall.id:
                        this.handleBallWallCollision(ball, tileRect);
                        break;
                    default:
                        this.handleBallTileCollision(ball, row, col);
                        if (ball.isDead) {
                            return;
                        }
                }
            }
        }
    }

    private handleBallWallCollision(ball: Ball, tileRect: Rect) {
        let delta = tileRect.center.sub(ball.origin);
        let n = delta.longestComponent;
        let cos = ball.speed.cosTo(n);
        if (cos < 0) {
            return;
        }

        let s = ball.speed.project(n);
        ball.speed = ball.speed.add(s.mul(-1.5));
    }

    private handleBallTileCollision(ball: Ball, row: number, col: number) {
        if (ball.area < this.captureCost) {
            return;
        }

        let tile = this.map.tiles[row][col];
        if (ball.faction.equal(tile.faction)) {
            return;
        }
        if (tile.faction.isWall) {
            // debugger;
            console.assert(!tile.faction.isWall);
        }

        tile.faction = ball.faction;
        ball.area -= this.captureCost;
        if (ball.isNegligible) {
            ball.die();
        }
    }

    private getTileRect(col: number, row: number): Rect {
        return new Rect(
            new Vec2D(col, row),
            new Vec2D(col + 1, row + 1)
        );
    }

    map: Map;
    balls: Ball[];
    nFactions: number;
}
