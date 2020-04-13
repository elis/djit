import cellParser from './cell-parser'
import compileAST from './ast-compiler'
import { addressToName, nameToAddress } from './utils'

const computer = (inputData = [], options = {}) => {
  const { context, onChange, getValue, onBeforeSet, getCell } = options
  
  const parseCellInput = (key, input, postUpdate) => {
    const parsed = cellParser(`${input}`)
    const _getValue = getValue && typeof getValue === 'function' 
      ? (value) => getValue(key, value)
      : null
      
    if (parsed && parsed.type) {
      try {
        const parse = compileAST(Data, Data[key], { getCell, postUpdate, context, getValue: _getValue })
        const computedValue = parse(parsed)
        return computedValue
      } catch (error) {
        console.error('Error:', error)
        return {
          type: 'error',
          value: 'ERROR AST'
        }
      }
    }
  }
  
  const processCell = (target, key, input) => {
    const prev = target[key]
    
    const postUpdate = (computed) => {
      target[key] = onBeforeSet && typeof onBeforeSet === 'function'
        ? onBeforeSet(key, {
          ...(target[key] || {}),
          ...computed,
          input
        }, postUpdate)
        : {
          ...(target[key] || {}),
          ...computed,
          input
        }
      
      if (computed && computed.value && computed.value instanceof Promise) {
        computed.value.then(value => {
          target[key] = onBeforeSet && typeof onBeforeSet === 'function'
            ? onBeforeSet(key, {
              ...(target[key] || {}),
              value
            }, postUpdate)
            : {
              ...(target[key] || {}),
              value
            }
  
          if (target[key] && target[key].listeners) {
            target[key].listeners.map(listener => processCell(target, listener))
          }
          if (onChange && typeof onChange === 'function') onChange(key, target[key], Data)
        })
      }
  
      if (target[key] && target[key].listeners) {
        target[key].listeners.map(listener => processCell(target, listener))
      }
      if (onChange && typeof onChange === 'function') onChange(key, target[key], Data)
    }

    input = typeof input !== 'undefined'
      ? input
      : (prev || {}).input || ''

    const computed = parseCellInput(key, input, postUpdate)

    if (computed && computed.references && computed.references.includes(key)) {
      return target[key] = {
        ...(target[key] || {}),
        input,
        value: 'ERROR REF',
        type: 'error'
      }
    }
    
    const nextRefs = computed && computed.references || []
    const prevRefs = prev && prev.references || []

    const addedRefs = nextRefs.filter(ref => !prevRefs.includes(ref))
    const removedRefs = prevRefs.filter(ref => !nextRefs.includes(ref))

    removedRefs.map(removed => {
      target[removed] = {
        ...(target[removed] || {}),
        listeners: [
          ...((target[removed] || {}).listeners || []).filter(listener => listener !== key)
        ]
      }
    })
    addedRefs.map(added => {
      target[added] = {
        ...(target[added] || {}),
        listeners: [
          ...((target[added] || {}).listeners || []).filter(listener => listener !== key),
          key
        ]
      }
    })
    
    postUpdate({ ...computed, references: nextRefs })
    
    return target[key]
  }
  
  
  const data = { }
  const dataHandler = {
    get (target, key) {
      return target[key]
    },
    set (target, key, input) {
      return processCell(target, key, input) || true
    }
  }
  const Data = new Proxy(data, dataHandler)
  
  const api = {
    Data,
    toArray: () => toArray(Data),
    inputsArray: () => toArray(Data, true),
    set: (col, row, value) => {
      const cid = addressToName(col, row)
      return Data[cid] = value
    }
  }
  const apiHandler = {
    get (target, key) {
      if (typeof key === 'string' && key.match(/^[A-Z]+[0-9]+$/)) {
        return (Data[key] || {}).value
      }
      return target[key]
    },
    set (target, key, value) {
      if (typeof key === 'string' && key.match(/^[A-Z]+[0-9]+$/)) {
        Data[key] = value
        return true
      }
      return target[key] = value
    }
  }
  const API = new Proxy(api, apiHandler)

  if (inputData && inputData.length) {
    inputData.map((row, rowId) => {
      if (row && row.length) {
        row.map((col, colId) => {
          const cid = addressToName(colId, rowId)
          Data[cid] = col
        })
      }
    })
  }
  
  return API
}

// API Methods
const toArray = (data, inputs = false) => {
  const cells = Object.entries(data)
  const output = []
  cells.map(([key, value]) => {
    const { row, col } = nameToAddress(key)
    if (!output[row]) {
      if (output.length < row + 1) {
        let setter = output.length
        while (output.length < row + 1) {
          output[setter++] = []
        }
      }
    }
    output[row][col] = value[inputs ? 'input' : 'value']
  })
  return output
}


export default computer