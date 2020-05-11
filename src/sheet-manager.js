import djit from './computer'

const SheetManager = (toptions = {}) => {
  const { onAdd, onRemove, onRename, ...opts } = toptions
  const sheets = {}
  const getSheets = () => sheets
  const sheetsUpdated = () => Object.entries(sheets).map(([, sheet]) => sheet.sheetsUpdated())

  return {
    add: (id, data = [], options) => {
      sheets[id] = djit(data , { ...opts, ...options, id, getSheets })
      sheetsUpdated()
      if (typeof onAdd === 'function') onAdd(id, sheets[id], sheets)
      return sheets[id]
    },
    remove: id => {
      delete sheets[id]
      sheetsUpdated()
      if (typeof onRemove === 'function') onRemove(id, sheets)
      return true
    },
    rename: (oldid, newdid) => {
      sheets[oldid].setSheetId(newdid)
      sheets[newdid] = sheets[oldid]
      delete sheets[oldid]
      
      sheetsUpdated()
      if (typeof onRename === 'function') onRename(oldid, newdid, sheets[newdid], sheets)
    },
    getSheets,
    sheets
  }
}

export default SheetManager