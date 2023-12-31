import { MapGenerator } from "./MapGenerator.js"
import { Map } from "./../Map.js"
import { Faction } from '../Faction.js';
import { random } from "../../util/util.js";

export class ArenaGen implements MapGenerator {
    generate(rows: number, cols: number, nFactions: number): Map {
        let map = new Map(rows, cols);
        for (let row = 0; row < rows; row++) {
            map.tiles[row][0].faction = Faction.Wall;
            map.tiles[row][cols - 1].faction = Faction.Wall;
        }
        for (let col = 0; col < cols; col++) {
            map.tiles[0][col].faction = Faction.Wall;
            map.tiles[rows - 1][col].faction = Faction.Wall;
        }
        const spacing = 5;
        // for (let row = 0; row < rows; row++) {
        //     if (row % spacing) {
        //         continue;
        //     }
        //     for (let col = 0; col < cols; col++) {
        //         if (col % spacing) {
        //             continue;
        //         }

        //         this.placeFaction(map, row, col, Faction.Wall.id);
        //     }
        // }
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.75) {
                    this.placeFaction(map, row, col, Faction.Wall.id);
                    continue;
                }
            }
        }
        // for (let row = 0; 7 / 3 * row < rows; row++) {
        //     let col = Math.round(cols / 2);
        //     this.placeFaction(map, row, col, Faction.Wall.id)
        // }
        // for (let col = 0; 7 / 3 * col < cols; col++) {
        //     let row = Math.round(rows / 2);
        //     this.placeFaction(map, row, col, Faction.Wall.id)
        // }
        // for (let row = Math.round(rows * 4 / 7); row < rows; row++) {
        //     let col = Math.round(cols / 2);
        //     this.placeFaction(map, row, col, Faction.Wall.id)
        // }
        // for (let col = Math.round(cols * 4 / 7); col < cols; col++) {
        //     let row = Math.round(rows / 2);
        //     this.placeFaction(map, row, col, Faction.Wall.id)
        // }

        for (let iter = 0; iter < 100; iter++) {
            for (let i = 1; i <= nFactions; i++) {
                this.placeFactionRandom(map, i);
            }
        }

        // this.placeFaction(map, 0, 0, 1);
        // this.placeFaction(map, 0, map.cols - 1, 2);
        // this.placeFaction(map, map.rows - 1, map.cols - 1, 3);
        // this.placeFaction(map, map.rows - 1, 0, 4);

        return map;
    }

    placeFactionRandom(map: Map, factionId: number) {
        // TODO: possible infinite loop
        let row: number;
        let col: number;
        do {
            row = random(map.rows);
            col = random(map.cols);
        } while (map.tiles[row][col].faction.id != Faction.Neutral.id)
        this.placeFaction(map, row, col, factionId);
    }

    placeFaction(map: Map, row: number, col: number, factionId: number) {
        map.tiles[row][col].faction = new Faction(factionId);
    }
}
