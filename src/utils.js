export const addressToName = (col, row) => {
  return `${numberToLetters(col + 1)}${row + 1}`
}

export const nameToAddress = input => {
  const result = `${input}`.match(/^([A-Z]+)([0-9]+)$/i)
  return { col: lettersToNumber(result[1]) - 1, row: +result[2] - 1 }
}

/*
 * Takes a positive integer and returns the corresponding column name.
 * @param {number} num  The positive integer to convert to a column name.
 * @return {string}  The column name.
 * 
 * Source: https://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
*/
export const numberToLetters = (num) => {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
  }
  return ret;
}

// convert A to 1, Z to 26, AA to 27
export const lettersToNumber = (letters) => {
    return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0);
}
export default {
  addressToName,
  nameToAddress,
  numberToLetters,
  lettersToNumber
}