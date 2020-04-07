import peg from 'pegjs'
import CellParser from 'raw-loader!./cell-parser.peg'

const parser = peg.generate(CellParser)

export default parser.parse