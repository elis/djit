export const addressToName = (col, row, sheet, colFix, rowFix) => {
  if (typeof col === 'object') return addressToName(col.col, col.row, col.sheet, col.colFix, col.rowFix)
  let result = ''
  if (sheet) result += sheet + '!'
  if (colFix) result += '$'
  result += numberToLetters(col + 1)
  if (rowFix) result += '$'
  result += (row + 1)

  return result
}

export const nameToAddress = input => {
  const result = `${input}`.match(/^([A-Z0-9_]+)?[!]?([$]?)([A-Z]+)([$]?)([0-9]+)$/i)
  return result && { 
    col: lettersToNumber(result[3]) - 1, 
    row: +result[5] - 1, 
    sheet: result[1], 
    colFix: !!result[2],
    rowFix: !!result[4]
  }
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