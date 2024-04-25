keys = {
    '0': false,
    '1': false,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '6': false,
    '7': false,
    '8': false,
    '9': false,

    'a': false,
    'b': false,
    'c': false,
    'd': false,
    'e': false,
    'f': false,
    'g': false,
    'h': false,
    'i': false,
    'j': false,
    'k': false,
    'l': false,
    'm': false,
    'n': false,
    'o': false,
    'p': false,
    'q': false,
    'r': false,
    's': false,
    't': false,
    'u': false,
    'v': false,
    'w': false,
    'x': false,
    'y': false,
    'z': false,

    'ArrowDown': false,
    'ArrowLeft': false,
    'ArrowRight': false,
    'ArrowUp': false,

    'Alt': false,
    'Backspace': false,
    'CapsLock': false,
    'Control': false,
    'Enter': false,
    'Shift': false,
    'Tab': false,
    'Escape': false,
    ' ': false,
}


class Keyboard {
    constructor() {
        this.keyPressed = keys;
        addEventListener("keydown", (event) => {this.keyDown(event)});
        addEventListener("keyup", (event) => {this.keyUp(event)});
    }

    keyDown(event) {
        this.keyPressed[event.key] = true;
    } 
    keyUp(event) {
        this.keyPressed[event.key] = false;
    }
}