const djit = require('../cjs/djit')

const sleep = async (time) => await new Promise(resolve => setTimeout(resolve, time))

let qdata
let vsheet

const context = {
  fireworks: input => `🎆 🌈 ✨ ${input} 🌟 💥 💫`,
  delayedBoom: (input, delay) => new Promise(resolve => setTimeout(() => resolve(async () => `💣 💣 💣 ${await input} 💣 💣 💣`), delay || 100)),
  listeners: input => (current, Data, postUpdate) => `${input}: ${current.listeners}`,
  multiBoom: input => (current, Data, postUpdate) => {
    for (let i = 0; i < 5; ++i) {
      const t = i
      setTimeout(() => {
        postUpdate(v => ({ value: v.value + [...Array(i)].join('💥')}))
      }, 100 * (t + 1))
    }
    return input + ' 💥'
  },
  echo: (...args) => args,
  delay: async (input, delay = 100) => new Promise(resolve => setTimeout(async () => resolve(await input)), delay),
  specialObject: value => ({ special: value, result: 'awesome!' }),
  updatingCell: value => (key, entry, postUpdate) => {
    for (let i = 0; i < 5; ++i) {
      const t = i
      setTimeout(() => {
        postUpdate(v => ({ value: v.value + 30 }))
      }, 100 * (t + 1))
    }
    return value
  }
}
const getSheets = () => ({ qdata, vsheet })


let onChangeQdata
let onChangeVsheet
beforeEach(() => {
  onChangeQdata = jest.fn((cid, value) => [cid, value]);
  onChangeVsheet = jest.fn((cid, value) => [cid, value]);

  qdata = djit.djit([], { id: 'qdata', onChange: onChangeQdata, getSheets, context: { Main: { ...context } } })
  vsheet = djit.djit([], { id: 'vsheet', onChange: onChangeVsheet, getSheets, context: { Main: { ...context } } })
})


describe('onBeforeSet', () => {
  let qdata
  let vsheet

  let onBeforeSetQdata
  let onBeforeSetVsheet
  
  beforeEach(() => {
    onBeforeSetQdata = jest.fn((cid, entry) => entry);
    onBeforeSetVsheet = jest.fn((cid, entry) => entry);
    const getSheets = () => ({ qdata, vsheet })
  
    qdata = djit.djit([], { id: 'qdata', onBeforeSet: onBeforeSetQdata, getSheets, context: { Main: { ...context } } })
    vsheet = djit.djit([], { id: 'vsheet', onBeforeSet: onBeforeSetVsheet, getSheets, context: { Main: { ...context } } })
  })
  
  test('Set special object', async () => {
    qdata.A1 = '=specialObject("test")'
    expect(qdata.A1).toStrictEqual({ result: 'awesome!', special: 'test' })
  })

  test('Updating cell', async () => {
    qdata.A1 = '=updatingCell(150)'
    expect(qdata.A1).toBe(150)

    await sleep(100)
    expect(qdata.A1).toBe(210)

    await sleep(400)
    expect(qdata.A1).toBe(450)
  })
})
describe('onChange', () => {

  test('Check onChange', () => {

    qdata.A12 = 'ABC'
    expect(onChangeQdata.mock.calls.length).toBe(1)
    expect(onChangeQdata.mock.calls[0][0]).toBe('A12')
    expect(onChangeQdata.mock.calls[0][1]).toStrictEqual({
      input: 'ABC',
      value: 'ABC',
      type: 'string',
      references: []
    })

    for (let i = 0; i < 1023; ++i) {
      qdata.A12 = i
    }

    expect(onChangeQdata.mock.calls.length).toBe(1024)
  })
  test('Check onChange references sheet', () => {

    qdata.A1 = 10
    vsheet.A1 = '=qdata!A1'
    expect(onChangeQdata.mock.calls.length).toBe(2)
    expect(onChangeVsheet.mock.calls.length).toBe(2)

    for (let i = 0; i < 1022; ++i) {
      qdata.A1 = i
    }
    expect(onChangeQdata.mock.calls.length).toBe(1024)
    expect(onChangeVsheet.mock.calls.length).toBe(1024)
  })

})
  