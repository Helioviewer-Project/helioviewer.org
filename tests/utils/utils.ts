/**
 * Generates a random integer within a specified range (inclusive).
 *
 * @param {number} min - The minimum integer value that can be returned.
 * @param {number} max - The maximum integer value that can be returned.
 * @returns {number} A random integer between the specified min and max values, inclusive.
 */
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { getRandomInt };
