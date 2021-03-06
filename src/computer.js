import _ from 'lodash'
import cellParser from './cell-parser'
import compileAST from './ast-compiler'
import { addressToName, nameToAddress } from './utils'
import treeify from 'treeify'
import assert from 'assert'


const computer = (inputData = [], options = {}) => {
  const { id, sheets, context, getContext, onChange, getSheets: _getSheets, getValue, onBeforeSet: _onBeforeSet, getCell: _getCell, initialValues = [] } = options
  const config = {
    sheetId: id,
    onChange
  }

  const getSheets = (silent = false) => {
    if (!config.sheetId && !silent) throw new Error('Unable to access other sheets without sheetID')
    return typeof _getSheets === 'function'
      ? _getSheets()
      : sheets
        ? sheets
        : {}
  }
  const Sheets = () => getSheets()
  const updates = {
    toTick: []
  }

  const getCell = typeof _getCell === 'function'
    ? (entry) => {
      const result = _getCell(entry && entry.value, entry)
      return {
        ...entry,
        ...(result || {})
      }
    }
    : entry => entry

  const onBeforeSet = typeof _onBeforeSet === 'function'
    ? (key, entry, postUpdate) => ({ ...entry, ...(_onBeforeSet(key, entry, postUpdate) || {}) })
    : (key, entry) => entry

  const compile = (parsed, current, postUpdate) => {
    const _getValue = getValue && typeof getValue === 'function'
      ? (value) => getValue(value)
      : null
    try {
      const parse = compileAST(Data, current, { sheets, getCell, postUpdate, context, getContext, getSheets, getValue: _getValue }, API)
      const computedValue = parse(parsed)
      return computedValue
    } catch (error) {
      console.error('Error:', error)
      return {
        error,
        type: 'error',
        value: 'ERROR AST: ' + error
      }
    }
  }
  const parse = (input, current = {}, postUpdate) => {
    if (Array.isArray(input)) {
      return {
        input,
        type: 'array',
        value: [...input]
      }
    }
    else if (typeof input === 'object') {
      return {
        input,
        type: 'object',
        value: { ...input }
      }
    }
    const parsed = cellParser(`${input}`)
    if (parsed && parsed.type) {
      const compiled = compile(parsed, current, postUpdate)
      return compiled
    }
    return {
      type: 'error',
      value: 'ERROR INPUT'
    }
  }

  const handleListener = (add = true) => (listener, voice) => {
    const remoteAddress = nameToAddress(voice)
    const remoteSheet = remoteAddress.sheet
    if (remoteSheet) {
      const localAddress = addressToName({ ...nameToAddress(listener), sheet: config.sheetId })
      const Sheet = Sheets()[remoteSheet]
      if (Sheet) {
        const remoteCid = addressToName({ ...remoteAddress, sheet: undefined })
        Sheet.patchCell(remoteCid, v => {
          const newValue = ({
            listeners: [
              ...(v.listeners || []).filter(rl => rl !== localAddress),
              ...(add ? [localAddress] : [])
            ]
          })
          return newValue
        })

      }
    } else {
      api.patchCell(voice, v => ({
        listeners: [
          ...(v.listeners || []).filter(rl => rl !== listener),
          ...(add ? [listener] : [])
        ]
      }))
    }
  }
  const addCellListener = handleListener(true)
  const removeCellListener = handleListener(false)

  const tick = ref => {
    const remoteAddress = nameToAddress(ref)
    const remoteSheet = remoteAddress.sheet
    if (remoteSheet) {
      const Sheet = Sheets()[remoteSheet]

      const remoteCid = addressToName({ ...remoteAddress, sheet: undefined })
      if (Sheet)
        Sheet.cellTick(remoteCid)
    } else {
      api.cellTick(ref)
    }
  }

  const engageListener = voice => e => updates.toTick.push(e)

  const cache = {}

  const engageListeners = (key) => {
    const cell = API.Data[key]
    const { listeners = [] } = cell || {}
    try {
      assert.deepEqual(cell, cache[key] || {})
    } catch (error) {
      const engage = engageListener(key)
      listeners.map(engage)
      
      if (config.onChange && typeof config.onChange === 'function') {
        cache[key] = _.cloneDeep(cell)
        config.onChange(key, cell)
      }

      setTimeout(() => {
        [...new Set(updates.toTick)].forEach(() => tick(updates.toTick.pop()))
      }, 0)
    }
  }

  const checkCircular = (key, references, originating, checked = []) => {
    if (references && references.length) {
      const result = references
        .reduce((res, ref) => {
          if (res) return res
          if (ref === key) return ref

          const { sheet: remoteSheet, ...remoteAddress } = nameToAddress(ref)
          if (remoteSheet) {
            const remoteCid = addressToName(remoteAddress)
            
            const Sheet = Sheets()[remoteSheet]

            const remoteCell = Sheet && Sheet.Data[remoteCid]

            const remoteRefs = remoteCell && remoteCell.references

            if (remoteRefs) {
              const localCid = addressToName({ ...nameToAddress(key), sheet: config.sheetId })
              const remoteConflicts = Sheet.checkCircular(localCid, remoteRefs, originating, [...checked, key])
              const refName = addressToName({ ...nameToAddress(ref), sheet: nameToAddress(ref).sheet && nameToAddress(ref).sheet === originating ? null : remoteSheet })
              if (remoteConflicts) return [refName, remoteConflicts] //.join(' ==> ')
            }
          } else {
            // check local conflicts
            const remoteCell = Data[ref]
            const remoteRefs = remoteCell && remoteCell.references
            if (remoteCell) {
              const remoteConflicts = checkCircular(key, remoteRefs, originating, [...checked, key])
              const refName = originating !== config.sheetId
                ? addressToName({ ...nameToAddress(ref), sheet: config.sheetId })
                : ref
              if (remoteConflicts) return [refName, remoteConflicts] //.join(' ++> ')
            }
          }
        }, false)
      return result
    }
    return false
  }

  const processCell = (target, key, input) => {
    const current = target[key]

    let allowPosts = true
    const postUpdate = (newValue) => {
      if (!allowPosts) {
        return;
      }
      if (typeof newValue === 'function')
        api.patchCell(key, newValue(target[key]))
      else
        api.patchCell(key, newValue)
    }
    const voidUpdates = () => {
      allowPosts = false
    }

    const parsed = parse(input, current, postUpdate)
    if (parsed && parsed.property) {

    }

    api.patchCell(key, (v = {}) => {
      const newValue = ({
        ...(v || {}),
        input,
        value: parsed && parsed.value,
        type: parsed.type,
        references: [
          ...((parsed && parsed.references) || [])
        ],
        ...(typeof parsed.resolved !== 'undefined' ? {resolved: parsed.resolved} : {})
      })

      return newValue
    }, voidUpdates)

    if (parsed && parsed.value instanceof Promise) {
      parsed.value.then(newValue => {
        postUpdate({ value: newValue })
      })
    }
  }

  const getCellData = cid => {
    const remoteAddress = nameToAddress(cid)
    const remoteSheet = remoteAddress.sheet
    if (remoteSheet) {
      const Sheet = Sheets()[remoteSheet]
      const remoteCid = addressToName({ ...remoteAddress, sheet: undefined })
      
      return Sheet.getCellData(remoteCid)
    } else {
      return data[cid]
    }
  }

  const sheetsUpdated = () => {
    const sheets = getSheets()
    const nsheets = { [null]: 'self ref', ...sheets } // first elm is null for local cell references
    Object.entries(data).map(([key, cell]) => {
      const resolved = cell.resolved
      if (!resolved) {
        // get references of the unresolved cell
        const unresolvedRefs = cell?.references?.map(ref => nameToAddress(ref))
        const unresolvedSheets = [...new Set(unresolvedRefs?.map(({sheet}) => sheet))]
        const availableSheets = unresolvedSheets?.filter(query => query in nsheets)
        if (availableSheets?.length) api.cellTick(key)
      }
    })
  }

  const setSheetId = (newId) => {
    const oldid = config.sheetId
    config.sheetId = newId
    api.sheetId = newId
    Object.entries(data)
      .map(([cid, cell]) => ([cid, cell]))
      .filter(([cid, cell]) => {
        const listeners = cell.listeners?.map(lid => [lid, nameToAddress(lid)]).filter(([lid, {sheet}]) => !!sheet)
        if (listeners?.length) {
          listeners.map(([lid, { sheet, ...address }]) => {
            const Sheet = Sheets()[sheet]
            
            if (Sheet) {
              const rid = addressToName(address)
              Sheet[rid] = Sheet.Data[rid].input.replace(oldid + '!', newId + '!')
            }
          })
        }
    })
  }

  const patchCell = (key, entry, voidUpdates) => {
    const entryValue = typeof entry === 'function'
      ? entry(data[key] || {})
      : entry

    const current = data[key]
    const currentRefs = [...((current && current.references) || [])]
    const isUnresolved = current
      ? typeof current.resolved !== 'undefined' && !current.resolved
      : entryValue && typeof entryValue.resolved !== 'undefined' && !entryValue.resolved

    const entryResolved = entryValue?.resolved

    const isNewlyResolved = isUnresolved && entryResolved

    const postUpdate = (newValue) => {
      if (typeof newValue === 'function')
        api.patchCell(key, newValue(data[key]))
      else
        api.patchCell(key, newValue)
    }
    if (isNewlyResolved)
      data[key] = onBeforeSet(key, {
        ...(data[key] || {}),
        resolved: true
      }, postUpdate)

    if (entryValue && entryValue.references) {
      const newRefs = isNewlyResolved
        ? entryValue.references || currentRefs || [] //_.difference(entryValue.references || currentRefs || [], [])
        : _.difference(entryValue.references || [], currentRefs)

      const removedRefs = _.difference(currentRefs, entryValue?.references || [])
      const conflicting = checkCircular(key, entryValue?.references || [], config.sheetId)

      if (conflicting) {
        if (typeof voidUpdates === 'function') voidUpdates()

        data[key] = onBeforeSet(key, {
          ...(data[key] || {}),
          ...entryValue,
          references: currentRefs,
          type: 'error',
          value: 'ERROR REF: ' + _.flattenDeep([conflicting, key]).join(' ⇢ '),
          ...(
            isNewlyResolved
            ? { resolved: true }
            : typeof entryValue.resolved !== 'undefined'
            ? { resolve: entryValue.resolved }
            : {}
          )
        }, postUpdate)

        engageListeners(key)
        return;
      }

      newRefs.map(ref => addCellListener(key, ref))
      removedRefs.map(ref => removeCellListener(key, ref))
    } else if (isNewlyResolved) {
      currentRefs.map(ref => addCellListener(key, ref))
    }

    data[key] = onBeforeSet(key, {
      ...(data[key] || {}),
      ...entryValue,
      ...(
        isNewlyResolved
        ? { resolved: true }
        : entryValue && typeof entryValue.resolved !== 'undefined'
        ? { resolved: entryValue.resolved }
        : {}
      )
    }, postUpdate)

    engageListeners(key)
  }

  const cellTick = (key) => {
    const cell = data[key] ?? {}
    const postUpdate = v => {
      api.patchCell(key, v)
    }
    const compiled = api.parse(cell.input, cell, postUpdate)
    api.patchCell(key, { ...compiled, input: cell.input })
  }


  const data = {}
  const dataHandler = {
    get(target, key) {
      return getCell(target[key])
    },
    set(target, key, input) {
      return processCell(target, key, input) || true
    }
  }
  const Data = new Proxy(data, dataHandler)

  const api = {
    sheetId: config.sheetId,
    Data,
    parse,
    patchCell,
    cellTick,
    checkCircular,
    processCell: (key, input) => processCell(data, key, input || (data[key] || {}).input),
    query: (input, current = {}, postUpdate) => parse(input, current, postUpdate).value,
    execute: (action, current = {}, postUpdate) => compile(action, current, postUpdate),
    toArray: () => toArray(Data),
    inputsArray: () => toArray(Data, true),
    set: (col, row, value) => {
      const cid = addressToName(col, row)
      return Data[cid] = value
    },
    getCellData,
    sheetsUpdated,
    asTree: () => asTree(API),
    setSheetId,
    setOnChange: (newOnChange) => {
      config.onChange = (...ar) => {
        newOnChange(...ar)
      }
    }
  }
  const apiHandler = {
    get(target, key) {
      if (typeof key === 'string' && key.match(/^[A-Z]+[0-9]+$/)) {
        return (Data[key] || {}).value
      }
      if (key === 'sheetId') return config.sheetId
      return target[key]
    },
    set(target, key, value) {
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


const asTree = (sheet) => {
  const built = {}

  const processItem = (val) => {
    return {
      input: val.input,
      value: val.value,
      ...(val.references || []).reduce((acc, ref) => ({ ...acc, [ref]: processItem(sheet.getCellData(ref)) }), {})
    }
  }
  Object.entries(sheet.Data)
    .sort(([a], [b]) => nameToAddress(a).row > nameToAddress(b).row ? 1 : 1)
    .sort(([a], [b]) => nameToAddress(a).col > nameToAddress(b).col ? 1 : 1)
    .map(([cid, cell]) => {
      const item = processItem(cell)
      built[cid] = item
    })

  const treeid = treeify.asTree(built, true)
  return treeid
}


export default computer