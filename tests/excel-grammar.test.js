const djit = require('djit')

let qdata
let mdata


beforeEach(() => {
  qdata = djit.djit()
  qdata.A1 = 2
  qdata.A2 = 5
  qdata.B1 = 10
  qdata.B2 = 20
})

describe('Strings', () => {
  test('="abc"', () => {
    const result = djit.cellParser('="abc"')

    expect(result.type).toBe('execute')
    expect(result.value.type).toBe('literal')
    expect(result.value.value).toBe('abc')
  })

  test('"abc"', () => {
    const result = djit.cellParser('abc')

    expect(result.type).toBe('string')
    expect(result.value).toBe('abc')
  })
})

describe('Commands', () => {

  test('=rand()', () => {
    const result = djit.cellParser('=rand()')

    expect(result.type).toBe('execute')
    expect(result.value.type).toBe('command')
    expect(result.value.comm).toBe('rand')
    expect(result.value.args).toStrictEqual([])
  })

  test('=rand("arg1", 2, 0.3, Awesome!A4, A5:A6)', () => {
    const result = djit.cellParser('=rand("arg1", 2, 0.3, Awesome!A4, A5:A6)')

    expect(result.type).toBe('execute')
    expect(result.value.type).toBe('command')
    expect(result.value.comm).toBe('rand')
    expect(result.value.args.length).toBe(5)
    expect(result.value.args[0].type).toBe('literal')
    expect(result.value.args[0].value).toBe('arg1')
    expect(result.value.args[1].type).toBe('integer')
    expect(result.value.args[1].value).toBe(2)
    expect(result.value.args[2].type).toBe('float')
    expect(result.value.args[2].value).toBe(0.3)
    expect(result.value.args[3].type).toBe('address')
    expect(result.value.args[3].address).toBe('A4')
    expect(result.value.args[3].sheet).toBe('Awesome')
    expect(result.value.args[4].type).toBe('range')
    expect(result.value.args[4].from.address).toBe('A5')
    expect(result.value.args[4].to.address).toBe('A6')
  })
})