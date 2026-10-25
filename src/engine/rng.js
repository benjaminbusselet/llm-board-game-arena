// Générateur pseudo-aléatoire déterministe (mulberry32) : une même graine donne le même plateau.
export function createRng(seed) {
    let a = seed >>> 0;
    return function next() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function pick(rng, array) {
    return array[Math.floor(rng() * array.length)];
}
