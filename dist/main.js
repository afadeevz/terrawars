import { Game } from "./Game.js";
function getCanvas() {
    return document.getElementById("gameCanvas");
}
function onResize() {
    let canvas = getCanvas();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
function main() {
    window.addEventListener("resize", onResize);
    onResize();
    let canvas = getCanvas();
    let game = new Game(canvas);
    game.start(93, 168, 4);
}
main();
//# sourceMappingURL=main.js.map