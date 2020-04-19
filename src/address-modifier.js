import cellParser from './cell-parser'
import utils from './utils'

const travers = (colDiff, rowDiff, value) => {
  const _t = (v) => travers(colDiff, rowDiff, v)
  if (!value || !value.type) {
    return value
  }

  value.property = value.property && value.property.map(_t)

  if (value.type === 'execute') {
    const newValue = _t(value.value)

    return {
      ...value,
      value: newValue
    }
  }

  else if (value.type === 'address') {
    const newCol = (utils.lettersToNumber(value.col) - 1) + (value.colFix ? 0 : colDiff)
    const newRow = (value.row - 1) + (value.rowFix ? 0 : rowDiff)
    const newAddress = utils.addressToName({
      col: newCol >= 0 ? newCol : 0,
      row: newRow >= 0 ? newRow : 0
    })

    return {
      ...value,
      col: utils.numberToLetters((newCol >= 0 ? newCol : 0) + 1),
      row: (newRow >= 0 ? newRow : 0) + 1,
      address: newAddress
    }
  }

  else if (value.type === 'compute') {
    const newInput = _t(value.input)
    const newOperations = value.operations.map(op => {
      const newOp = {
        ...op,
        value: _t(op.value)
      }
      return newOp
    })

    return {
      ...value,
      input: newInput,
      operations: newOperations
    }
  }

  else if (value.type === 'group') {
    const newExecute = _t(value.execute)

    return {
      ...value,
      execute: newExecute
    }
  }

  else if (value.type === 'command') {
    const newArgs = value.args.map(_t)

    return {
      ...value,
      args: newArgs
    }
  }
  
  else if (value.type === 'range') {
    return {
      ...value,
      from: _t(value.from),
      to: _t(value.to)
    }
  }

  return value
}

const staticTrees = ['integer', 'float', 'string']
const compileTreeToInput = (tree) => {
  const _c = compileTreeToInput
  if (!tree) {
    return '🚧'
  }

  const props = tree.property && tree.property.length
    ? tree.property.map(
        prop => prop.arrayNotation
          ? '[' + _c(prop) + ']'
          : '.' + _c(prop)
        ).join('')
    : ''

  if (tree.type === 'execute') {
    return '=' + _c(tree.value) + props
  }

  else if (tree.type === 'compute') {
    const input = _c(tree.input)
    const ops = tree.operations.map(op => {
      return op.op + ' ' + _c(op.value)
    }).join(' ')

    return `${input} ${ops}${props}`
  }

  else if (tree.type === 'address') {
    const address = utils.rangeAddressToName(tree)

    return address + props
  }

  else if (tree.type === 'command') {
    const args = tree.args.map(arg => _c(arg)).join(', ')

    return `${tree.comm}(${args})${props}`
  }

  else if (tree.type === 'range') {
    const from = _c(tree.from)
    const to = _c(tree.to)

    return `${from}:${to}${props}`
  }

  else if (tree.type === 'group') {
    const execute = _c(tree.execute)

    return `(${execute})${props}`
  }

  else if (tree.type === 'literal') {
    return tree.raw
  }
  
  else if (staticTrees.includes(tree.type)) {
    return tree.value
  }
  
  // console.log('🍓 Unhandled tree...', tree)
  return '🍓'
}

export const addressModifier = (colDif, rowDiff, input) => {
  const parsed = cellParser(input)
  const newValue = travers(colDif, rowDiff, parsed)
  const newInput = compileTreeToInput(newValue)
  return newInput
}

export default addressModifier