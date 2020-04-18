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
  delay: async (input, delay = 100) => new Promise(resolve => setTimeout(async () => resolve(await input)), delay)
}
const getSheets = () => ({ qdata, vsheet })

beforeEach(() => {
  qdata = djit.djit([[2, 10, 18], [5, 20, 7], [7, 41, 2]], { id: 'qdata', getSheets, context: { Main: { ...context } } })
  vsheet = djit.djit([[4000, 2030, 3233], [8011, 9002, 1391], [3555, 1464, 8442]], { id: 'vsheet',  getSheets, context: { Main: { ...context } } })
})

describe('Delayed commands and postUpdate', () => {

  test('Value updates across sheets', async () => {
    qdata.A5 = '=vsheet!A1'
    expect(qdata.A5).toBe(4000)

    vsheet.A6 = '=qdata!A2:B3'
    expect(vsheet.A6).toStrictEqual([[5, 20], [7, 41]])

    qdata.A7 = '=vsheet!A6[1][1]'
    expect(qdata.A7).toBe(41)

    vsheet.A8 = '=qdata!A7 * 10'
    expect(vsheet.A8).toBe(410)
    
    qdata.B3 = 57
    await sleep(0)

    expect(vsheet.A8).toBe(570)
  })

  test('Value updates across sheets from arguments', () => {
    qdata.A5 = '=vsheet!A1'
    expect(qdata.A5).toBe(4000)

    vsheet.A6 = '=qdata!A2:B3'
    expect(vsheet.A6).toStrictEqual([[5, 20], [7, 41]])

    qdata.A7 = '=vsheet!A6[1][1]'
    expect(qdata.A7).toBe(41)

    qdata.X1 = 1

    vsheet.A8 = '=echo(qdata!A7, qdata!A5)'
    expect(vsheet.A8).toStrictEqual([41, 4000])
    qdata.B3 = 57

    vsheet.A10 = '=A8[qdata!X1]'
    expect(vsheet.A10).toBe(4000)
  })

})