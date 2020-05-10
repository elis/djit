const SheetManager = (toptions = {}) => {
  const sheets = {}
  const getSheets = () => sheets
  const sheetsUpdated = () => Object.entries(sheets).map(([, sheet]) => sheet.sheetsUpdated())

  return {
    add: (id, data = [], options) => {
      sheets[id] = djit.djit(data , { ...toptions, ...options, id, getSheets })
      sheetsUpdated()
      return sheets[id]
    },
    remove: id => {
      delete sheets[id]
      sheetsUpdated()
      return true
    },
    rename: (oldid, newdid) => {
      sheets[oldid].setSheetId(newdid)
      sheets[newdid] = sheets[oldid]
      delete sheets[oldid]
      
      sheetsUpdated()
    },
    sheets
  }
}

export default SheetManager