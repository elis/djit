const djit = require('djit')

describe('Basic Arithmatic Operations', () => {
  let qdata
  let mdata

  beforeEach(() => {
    qdata = djit.djit()
    qdata.A1 = 2
    qdata.A2 = 5
    qdata.B1 = 10
    qdata.B2 = 20
  })


  test('Self references', () => {
    qdata.A1 = '=A1 + 2'
    expect(qdata.A1).toBe('ERROR REF: A1 ⇢ A1')
  })

  test('Unknown command', () => {
    qdata.A1 = '=unknown()'
    expect(qdata.A1).toBe('ERROR EXE')
  })

  test('Unknown incomplete syntax', () => {
    qdata.A1 = '=bad('
    expect(qdata.A1).toBe('=bad(')
  })
})