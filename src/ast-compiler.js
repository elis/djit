import { nameToAddress, addressToName } from './utils'

const compileAST = (Data, current, options = {}) => {
  const { context = {}, getValue } = options
  let applyInnerAST
  const gv = typeof getValue === 'function'
    ? x => getValue(x)
    : x => x

  const computeOp = (_input, op, _subject) => {
    const input = gv(_input)
    const subject = gv(_subject)

    if (op === '+') return input + subject
    else if (op === '-') return input - subject
    else if (op === '*') return input * subject
    else if (op === '/') return input / subject
    else if (op === '^') return Math.pow(input, subject)

    throw new Error('Unknown operation', op)
  }
  const executeOp = (input, op, subject) => {
    input = gv(input)
    subject = gv(subject)

    if (input instanceof Promise) {
      if (subject instanceof Promise) {
        return input.then(v => subject.then(s => [v, s])).then(([v, s]) => computeOp(v, op, s))
      }
      return input.then(v => computeOp(input, op, v))
    }
    if (subject instanceof Promise) {
      if (input instanceof Promise) {
        return subject.then(v => input.then(s => [s, v])).then(([v, s]) => computeOp(v, op, s))
      }
      return subject.then(v => computeOp(input, op, v))
    }
    return computeOp(input, op, subject)
  }

  const computeProperties = (entry, properties) => {
    let value = entry && entry.value

    const references = new Set()
    properties.map(prop => {
      const compiledProp = applyInnerAST(prop)
      if (!compiledProp) return null

      if (compiledProp.type === 'string' || compiledProp.type === 'integer') {
        value = value && value[compiledProp.value]
      }
      if (compiledProp.references && compiledProp.references.length) {
        compiledProp.references.map(ref => references.add(ref))
      }
    })
    return {
      references: [...references],
      value
    }
  }

  const astActions = {
    address(input, action) {
      const { address, property } = action
      const { listeners, ...cell } = Data[address] || {}
      const references = new Set()
      references.add(address)
      const value = cell.value

      if (property) {
        const properties = computeProperties({ ...cell, value }, property)
        return {
          value: properties && properties.value,
          references: [...references, ...(properties.references || {})]
        }
      }
      return {
        ...cell,
        references: [...references]
      }
    },
    execute(input, action) {
      const result = applyInnerAST(input)
      if (result.type === 'range') {
        const range = result.value.map(r => r.map(cid => Data[cid]).map(({value} = {}) => value))
        return {
          ...result,
          value: range
        }
      }
      return result
    },
    compute(input, action) {
      const references = new Set()
      const left = applyInnerAST(action.input)
      if (left.references && left.references.length) {
        left.references.map(r => references.add(r))
      }

      let result = gv(left.value)

      action.operations.map(op => {
        const right = applyInnerAST(op.value)
        if (right) {
          if (right.references && right.references.length) {
            right.references.map(r => references.add(r))
          }

          result = executeOp(result, op.op, gv(right.value))
        }
      })

      return {
        value: result,
        references: [...references]
      }
    },
    command(input, action) {
      const { comm, args } = action
      const references = new Set()

      const executable = context && (Object.values(context).find(ctx => {
        return ctx && typeof ctx[comm] === 'function'
      }) || {})[comm]

      if (!executable) return {
        type: 'error',
        value: 'ERROR EXE'
      }

      const run = (args) => {
        const result = executable.apply(executable, args)
        if (typeof result === 'function') {
          return result(current, Data, options.postUpdate)
        }
        return result
      }

      const parsedArgs = args && args.length
        ? args.map(arg => {
          const parsedArg = applyInnerAST(arg)
          if (parsedArg) {
            if (parsedArg.references) {
              parsedArg.references.map(ref => references.add(ref))
            }
            if (parsedArg.type === 'range') {
              const range = parsedArg.value.map(r => r.map(cid => Data[cid]).map(({value} = {}) => value))
              return {
                ...parsedArg,
                value: range
              }
            }
          }
          return parsedArg
        })
        : []

      if (parsedArgs && parsedArgs.length) {
        // If only one argument provided to a function is a range attempt to spread it as the arguments
        if (parsedArgs.length === 1 && parsedArgs[0].type === 'range') {
          if (parsedArgs[0].rows === 1 || parsedArgs[0].cols === 1) {
            const inputs = []
            parsedArgs[0].value.map(r => r.map(v => inputs.push(v)))
            const result = run(inputs)
            return {
              value: result,
              references: [...references]
            }
          }
        }
      }
      const inputs = parsedArgs.map(({value}) => value)
      const result = run(inputs)

      return {
        references: [...references],
        value: result,
        arguments: args
      }
    },
    range(input, action) {
      const references = new Set()

      const cidStart = nameToAddress(action.from.address)
      const cidEnd = nameToAddress(action.to.address)

      const colStart = cidStart.col
      const colEnd = cidEnd.col

      const rowStart = cidStart.row
      const rowEnd = cidEnd.row

      const rows = (rowEnd - rowStart) + 1
      const cols = (colEnd - colStart) + 1

      const result = []
      for (let row = rowStart; row < rowStart + rows; ++row) {
        const k = []
        for (let col = colStart; col < colStart + cols; ++col) {
          const cid = addressToName(col, row)
          references.add(cid)
          k.push(cid)
        }
        result.push(k)
      }
      return {
        rows,
        cols,
        references: [...references],
        type: 'range',
        value: result
      }
    }
  }

  const staticActions = ['string', 'integer', 'float', 'literal', 'error', 'pending']

  applyInnerAST = (action) => {
    if (action && action.type && staticActions.indexOf(action.type) >= 0) {
      return action
    }
    else if (action.type && typeof astActions[action.type] === 'function') {
      const result = astActions[action.type](action.value, action)
      if (!result) return action.value
      return result
    }
    else throw new Error(`Unknown action type "${action.type}"`)
  }
  return applyInnerAST
}

export default compileAST