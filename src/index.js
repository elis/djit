import computer from './computer';
import cellParser from './cell-parser'
import addressModifier from './address-modifier'
import * as utils from './utils'
import pkg from '../package.json'
export const djit = computer


export default computer
const version = pkg.version

export {
  version,
  utils,
  cellParser,
  addressModifier
}