import { nameToAddress, addressToName } from './utils'

const compileAST = (Data, current, options = {}, api) => {
  const { sheets = {}, context = {}, getContext, getSheets, getValue } = options
  let applyInnerAST

  const Sheets = () => typeof getSheets === 'function'
    ? getSheets()
    : sheets
    ? sheets
    : {}

  const getCell = typeof options.getCell === 'function'
    ? options.getCell
    : (value) => value
    
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

  const computeProperties = (entry, properties, group) => {
    const value = entry && entry.value
    const references = new Set()

    const compiledValue = properties
      .reduce((result, prop) => {

        const compiledProp = prop.result
          ? { value: result }
          : applyInnerAST(prop)

        if (!compiledProp) return null
        if (compiledProp.references && compiledProp.references.length) {
          compiledProp.references.map(ref => references.add(ref))
        }
        if (result && compiledProp.type === 'string' || compiledProp.type === 'integer' || typeof compiledProp.value === 'string' || typeof compiledProp.value === 'number') {
          return !!result && result[compiledProp.value]
        }
        return result

      }, value)

    return {
      references: [...references],
      value: compiledValue
    }
  }

  const computeCommandProperties = (target, properties) => {
    let value = target
    const references = new Set()
    
    properties.map(prop => {
      const compiledProp = applyInnerAST(prop)
      if (!compiledProp) return null
      if (prop.group) {
        value = compiledProp.value
      }
      else if (compiledProp.type === 'string' || compiledProp.type === 'integer' || typeof compiledProp.value === 'string' || typeof compiledProp.value === 'number') {
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

    // A5
    address(input, action) {
      const { address, sheet, property, group } = action
      const { listeners, ...cell } = Data[address] || {}
      const references = new Set()
      references.add(address)
      const value = cell.value

      if (sheet) {
        const Sheet = Sheets()[sheet]
        if (Sheet) {
          const { sheet, ...request } = action
          try {
            const { references, ...result } = Sheet.execute(request)
            if (result && result.type === 'error') return {
              ...result,
              type: 'error',
              value: 'ERROR VAL ' + sheet + '!' + address,
              references: references && references.length && references.map(nameToAddress).map(q => ({...q, sheet})).map(addressToName)
            }

            references.map(nameToAddress).map(q => ({...q, sheet})).map(addressToName)

            return getCell({
              ...result,
              references: references && references.length && references.map(nameToAddress).map(q => ({...q, sheet})).map(addressToName)
            })
          } catch (error) {
            // console.error('Error remote:', error)
            // console.groupEnd()

            return getCell({
              ...cell,
              type: 'error',
              value: 'ERROR ADDR',
              error
            })
          }
        }
      }
      if (cell.type === 'error') {
        return getCell({
          ...cell,
          references: [...references]
        })
      }

      if (property) {
        if (group) {

          const properties = computeProperties({ ...cell, value }, property, true)
          return getCell({
            value: properties && properties.value,
            references: [...references, ...(properties.references || {})]
          })
        } else {
          const properties = computeProperties({ ...cell, value }, property)

          return getCell({
            value: properties && properties.value,
            references: [...references, ...(properties.references || [])],
            properties
          })
        }
      }

      return getCell({
        ...cell,
        references: [...references]
      })
    },

    // =
    execute(input, action) {
      const result = applyInnerAST(input)
      return result
    },

    // =2 + 4
    compute(input, action) {
      const references = new Set()
      const left = applyInnerAST(action.input)
      if (left.references && left.references.length) {
        left.references.map(r => references.add(r))
      }

      if (left && left.type === 'error') {
        return {
          type: 'error',
          value: action.input.type === 'address' ? 'ERROR VAL ' + (action.input.sheet ? action.input.sheet + '!' : '') + action.input.address + ' ' : left.value,
          references: [...references]
        }
      }
      let result = gv(left.value)

      let lastType = left.type

      action.operations.map(op => {
        const right = applyInnerAST(op.value)
        if (right) {
          if (right.references && right.references.length) {
            right.references.map(r => references.add(r))
          }

          if (right.type === 'error') {

            return {
              type: 'error',
              value: op.value.type === 'address' ? 'ERROR VAL ' + op.value.address : right.value,
              references: [...references]
            }
          }
          if (!lastType) lastType = right.type
          result = executeOp(result, op.op, gv(right.value))
        }
      })

      return {
        type: lastType,
        value: result,
        references: [...references]
      }
    },

    // =rand(A1, A3:A15) <- `rand` is a function provided by context
    command(input, action) {
      const { comm, args, property } = action
      const references = new Set()

      if (action.result) return result
      const layContext = (typeof getContext === 'function' && getContext()) || {}
      const contextCollection = {...context, layContext}

      const executable = (Object.values(contextCollection).find(ctx => {
        return ctx && typeof ctx[comm] === 'function'
      }) || {})[comm]

      if (!executable) return {
        type: 'error',
        value: 'ERROR EXE'
      }

      const run = (args) => {
        const result = executable.apply(executable, args)
        const evaluate = (subject = {}) => {
          if (typeof subject === 'function') {
            return subject(current, Data, options.postUpdate, api)
          }
          else if (subject instanceof Promise) {
            return subject.then(v => {
              return evaluate(v)
            })
          }
          if (property) {
            const properties = computeCommandProperties(subject, property)
            return properties.value
          }
          return subject
        }
        return evaluate(result || {})
      }

      const parsedArgs = args && args.length
        ? args.map(arg => {
          const parsedArg = applyInnerAST(arg)
          if (parsedArg) {
            if (parsedArg.references) {
              parsedArg.references.map(ref => references.add(ref))
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
      
      const properties = property && property.length && computeCommandProperties(result, property)

      if (properties && properties.references) {
        properties.references.map(ref => references.add(ref))
      }

      // Check for promises
      const processInputs = (inputs, skip = false) => {
        const inputsIsPromise = inputs && inputs.length && inputs.find(e => e instanceof Promise)

        if (inputsIsPromise) {
          const ourPromise = Promise.all(inputs).then(async (newInputs) => {

            const newCell = await processInputs(newInputs, true)
            const newValue = await newCell.value
            if (skip) {
              options.postUpdate(v => ({ ...newCell, value: newValue }))
            }
            return newValue
          })

          return {
            references: [...references],
            value: ourPromise,
            arguments: args,
            inputs,
            parsedArgs
          }
        }
        
        const result = run(inputs)
        if (result instanceof Promise) {
          const ourPromise = result.then(newResult => {
            return newResult
          })
          return {
            references: [...references],
            value: ourPromise,
            arguments: args,
            inputs,
            parsedArgs
          }
        }
        return {
          references: [...references],
          value: result,
          arguments: args,
          inputs,
          parsedArgs
        }
      }
      return processInputs(inputs)
      
    },

    // =A1:Z42
    range(input, action) {
      const references = new Set()
      const remoteSheet = action.from.sheet
      const cidStart = nameToAddress(action.from.address)
      const cidEnd = nameToAddress(action.to.address)

      const colStart = cidStart.col
      const colEnd = cidEnd.col

      const rowStart = cidStart.row
      const rowEnd = cidEnd.row

      const rows = (rowEnd - rowStart) + 1
      const cols = (colEnd - colStart) + 1


      if (remoteSheet) {
        const Sheet = Sheets()[remoteSheet]
        if (Sheet) {

          const { from: { sheet, ...from}, ...request } = action
          try {
            const { references, value, ...result } = Sheet.execute({...request, from})
            const compiled = { 
              references: references && references.length && references.map(nameToAddress)
                .map(q => addressToName({ ...q, sheet })), 
              value,
              ...result
            }
            return compiled
          } catch (error) {
            return {
              ...cell,
              type: 'error',
              value: 'ERROR ADDR',
              error
            }
          }
        }
      }

      const result = []
      for (let row = rowStart; row < rowStart + rows; ++row) {
        const k = []
        for (let col = colStart; col < colStart + cols; ++col) {
          const cid = addressToName(col, row)
          references.add(cid)

          const value = Data[cid]
          k.push(value && value.value)
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
    },

    // =(A2.A3).A4 <- A2.A3 executed as "group"
    group: (input, action) => {
      const result = applyInnerAST({
        ...action.execute,
        group: true
      })
      const compiledProperty = action.property && computeProperties(result, action.property, true)
      return {
        group: true,
        value: compiledProperty.value,
        references: [...result.references, ...compiledProperty.references]
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