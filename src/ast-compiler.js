import { nameToAddress, addressToName } from './utils'

const compileAST = (Data, options = {}) => {
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

      let result = gv(left.value)
      let type = left.type

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
              return arg.value.map(cell => Data[cell]).map(({ value }) => gv(value))
            }
            return gv(arg.value)
          })

          const result = execArgs.find(a => a instanceof Promise)
            ? Promise.all(execArgs).then(resolvedArgs => executable[comm].apply(executable, resolvedArgs))
            : executable[comm].apply(executable, execArgs)

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