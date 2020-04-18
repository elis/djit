import cellParser from './cell-parser'

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
export const rangeAddressToName = (range) => {
  return addressToName({
    col: lettersToNumber(range.col) - 1,
    row: range.row - 1,
    sheet: range.sheet,
    colFix: range.colFix,
    rowFix: range.rowFix
  })
}

export const nameToAddress = input => {
  const res = cellParser('=' + input)
  if (res.type === 'execute') {
    if (res.value.type === 'address') {
      const { sheet, row, col, colFix, rowFix } = res.value
      return {
        sheet,
        colFix,
        rowFix,
        col: lettersToNumber(col) - 1,
        row: row - 1
      }
    }
  }
  return false
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
  rangeAddressToName,
  nameToAddress,
  numberToLetters,
  lettersToNumber
}