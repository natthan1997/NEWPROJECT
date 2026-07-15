const IS_UPPER_VOWEL = (c: number) => [0xD1, 0xD4, 0xD5, 0xD6, 0xD7, 0xE7].includes(c);
const IS_TONE = (c: number) => [0xE8, 0xE9, 0xEA, 0xEB, 0xEC].includes(c);
const IS_LOWER_VOWEL = (c: number) => [0xD8, 0xD9].includes(c);
const IS_LONG_TAIL_UP = (c: number) => [0xBB, 0xBD, 0xBF, 0xCA].includes(c); // ป, ฝ, ฟ, ฬ

export function levelThaiBytes(bytes: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    let curr = bytes[i];
    let prev = i > 0 ? bytes[i - 1] : 0;
    
    // If tone mark
    if (IS_TONE(curr)) {
      if (IS_LONG_TAIL_UP(prev)) {
        result.push(curr - 0x60); // Shift Left & Down (0xE8 -> 0x88)
      } else if (!IS_UPPER_VOWEL(prev) && !IS_LOWER_VOWEL(prev)) {
        result.push(curr - 0x50); // Shift Down (0xE8 -> 0x98)
      } else if (IS_UPPER_VOWEL(prev)) {
        // Look at prev-prev
        let prevPrev = i > 1 ? bytes[i - 2] : 0;
        if (IS_LONG_TAIL_UP(prevPrev)) {
          result.push(curr - 0x60); // Shift Left Top (0xE8 -> 0x88)
        } else {
          result.push(curr); // Normal Top
        }
      } else {
        result.push(curr);
      }
    } 
    // If upper vowel
    else if (IS_UPPER_VOWEL(curr)) {
      if (IS_LONG_TAIL_UP(prev)) {
        result.push(curr - 0x50); // Shift Left (0xD4 -> 0x84)
      } else {
        result.push(curr);
      }
    }
    // Normal character
    else {
      result.push(curr);
    }
  }
  return result;
}
