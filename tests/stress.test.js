const djit = require('../cjs/djit')

// Can be used as a benchmarking tool
// Check the commented out code below

describe('Stress test', () => {
  test('Create and update 1250 cell dependencies', () => {
    let qdata
  
    const onChange = (cid, value) => {
      // console.log('🔤 Changed:', cid, !!value)
    }
    qdata = djit.djit([], { onChange })
  
  
    const initialVal = 100
    const x = 50
    const y = 25
    const base = djit.utils.addressToName({col: 0, row: y + 18})
    // console.log('what is base?', base)
    qdata[base] = initialVal
  
    const startCreating = Date.now()
  
    let cid
    let prev
    let count = 0
    let items = []
  
    for (let row = 0; row < y; ++row) {
      for (let col = 0; col < x; ++col) {
        ++count
        cid = djit.utils.addressToName({row, col})
        const prevCoord = col > 0
          ? {col: col - 1, row}
          : row > 0
          ? {col: x - 1, row: row - 1}
          : {col: 0, row: y + 18}
        
        prev = djit.utils.addressToName(prevCoord)
        qdata[cid] = `=${prev} + 10`
        items.push(Date.now())
      }
    }

    const lengths = items.map((time, i, arr) => i ? time - arr[i - 1] : time - startCreating)
    const average = lengths.reduce((total, l) => total + l, 0) / lengths.length

    // console.log('Lengths:', lengths)
    // console.log('Average:', average)

  
    const endCreating = Date.now()
    const creationDuration = endCreating - startCreating
  
    const go = async () => {
  
      // console.log(`qdata.${cid}`, qdata[cid])
      // console.log(`qdata.Data.${cid}`, qdata.Data[cid])
      // console.table({
      //   'Creation duration': creationDuration + 'ms',
      //   'Cell count': count,
      //   'Last CID': cid,
      //   'Average cell set duration': average + 'ms'
      // })
  
      const measure = async (val) => {
        const start = Date.now()
        const lastValue = qdata[cid]
        // console.log('qdata'); console.log(qdata.asTree())
        qdata[base] = val
        while (qdata[cid] !== val + (y * x * 10)) {
          await new Promise(resolve => setTimeout(resolve, 500))
          // console.log('value is:', val + (y * x * 10), qdata[cid])
        }
        const end = Date.now()
        
        // console.table({
        //   'Last CID': cid,
        //   'Cell count': count,
        //   'Value updated to': val,
        //   'Creation duration': creationDuration + 'ms',
        //   'Average cell set duration': average + 'ms',
        //   'Edit time': end - start + 'ms'
        // })
        expect(qdata[cid]).toBe(val + (y * x * 10))
      }
  
      await measure(500)
      // await measure(2300)
      // await measure(33300)
      // await measure(3333300)
      // await measure(Math.pow(20, 22))
      // qdata[base] = 1100
      // while (qdata[cid] !== lastValue + 1000) {
      //   await new Promise(resolve => setTimeout(resolve, 500))
      //   console.log('value is:', lastValue, qdata[cid])
      // // }
      // console.log(`Changed: qdata.${base}`, qdata[base])
      // console.log(`qdata.${cid}`, qdata[cid])
      // console.log(`qdata.Data.${cid}`, qdata.Data[cid])
  
      // setTimeout(() => {
      //   console.log(`Changed: qdata.${base}`, qdata[base])
      //   console.log(`qdata.${cid}`, qdata[cid])
      //   console.log(`qdata.Data.${cid}`, qdata.Data[cid])
      // }, 1000)
    }
    go()
    // console.log('qdata'); console.log(qdata.asTree())
    // console.log('vsheet'); console.log(vsheet.asTree())
  
  
    const tablify = (sheet) => {
      const result = sheet.toArray().map(r => r.reduce((acc, v, i) => ({...acc, [djit.utils.numberToLetters(i + 1)]: v }), {})).reduce((acc, v, i) => ({...acc, [i + 1]: v }), {})
      // const result.replace(' (index) ', sheet.sheetId)
      const asTable = console.table
      console.log(sheet.sheetId)
      return asTable(result)
    }
  })
})