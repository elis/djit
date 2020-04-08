import { nameToAddress, addressToName } from './utils'

const compileAST = (Data, options = {}) => {
  const { context = {} } = options
  let applyInnerAST

  const executeOp = (input, op, subject) => {
    if (op === '+') return input + subject
    else if (op === '-') return input - subject
    else if (op === '*') return input * subject
    else if (op === '/') return input / subject
    else if (op === '^') return Math.pow(input, subject)

    throw new Error('Unknown operation', op)
  }

  const astActions = {
    address(input, action) {
      const { address } = action
      const { listeners, ...cell } = Data[address] || {}
      return {
        ...cell,
        references: [address]
      }
    },
    execute(input, action) {
      const result = applyInnerAST(input)
      return result
    },
    compute(input, action) {
      const references = new Set()
      const left = applyInnerAST(action.input)
      if (left.references && left.references.length) {
        left.references.map(r => references.add(r))
      }

      let result = left.value
      let type = left.type

      const ops = action.operations.map(op => {
        if (!(result instanceof Promise)) {
          const right = applyInnerAST(op.value)
          if (right) {
            if (right.value instanceof Promise) {
              result = right.value
            } else {
              if (right.references && right.references.length) {
                right.references.map(r => references.add(r))
              }
              result = executeOp(result, op.op, right.value)
            }
          }
        }
      })

      return {
        type,
        value: result,
        references: [...references]
      }
    },
    command(input, action) {
      const { comm, args } = action
      const parsedArgs = []
      const references = new Set()

      if (args && args.length) args.map(arg => {
        const parsedArg = applyInnerAST(arg)
        if (arg.type === 'range' && Array.isArray(parsedArg)) {
          parsedArg.map(parg => {
            if (parg.referernces) {
              parg.referernces.map(ref => references.add(ref))
            }
          })
          return parsedArgs.push(...parsedArg)
        } else {
          if (parsedArg.references) {
            parsedArg.references.map(ref => references.add(ref))
          }
          parsedArgs.push(parsedArg)
        }
        return parsedArg
      }) || []

      const executable = context && Object.values(context).find(ctx => {
        return ctx && typeof ctx[comm] === 'function'
      })
      if (executable && typeof executable[comm] === 'function') {
        if (action.args && action.args.length === 1 && action.args[0].type === 'range') {
          const execArgs = parsedArgs[0].value.map(cid => Data[cid]).map(({ value }) => value)
          const result = executable[comm].apply(executable, execArgs)

          return {
            references: [...references],
            value: result
          }
        } else {
          const execArgs = parsedArgs.map(arg => {
            if (arg.type === 'range') {
              return arg.value.map(cell => Data[cell]).map(({ value }) => value)
            }
            return arg.value
          })
          const result = executable[comm].apply(executable, execArgs)
          return {
            references: [...references],
            value: result
          }
        }
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

      if (cols === 1) {
        const result = []
        for (let row = rowStart; row < rowStart + rows; ++row) {
          for (let col = colStart; col < colStart + cols; ++col) {
            const cid = addressToName(col, row)
            references.add(cid)
            result.push(cid)
          }
        }
        return {
          references: [...references],
          type: 'range',
          value: result
        }
      }
    }
  }

  const staticActions = ['string', 'integer', 'float', 'literal', 'error', 'pending']

  applyInnerAST = (action) => {
    const references = []
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