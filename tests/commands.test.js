const djit = require('../cjs/djit')

const sleep = async (time) => await new Promise(resolve => setTimeout(resolve, time))

let qdata
let mdata

const context = {
  fireworks: input => `🎆 🌈 ✨ ${input} 🌟 💥 💫`,
  delayedBoom: (input, delay) => new Promise(resolve => setTimeout(() => resolve(async () => `💣 💣 💣 ${await input} 💣 💣 💣`), delay || 100)),
  listeners: input => (current, Data, postUpdate) => (false && console.log('cell invoked?', {input, current, Data})) || `${input}: ${current.listeners}`,
  multiBoom: input => (current, Data, postUpdate) => {
    const value = input + ' 💥'
    for (let i = 0; i < 5; ++i) {
      const t = i
      setTimeout(() => {
        postUpdate(v => ({ value: value + [...Array(i)].join('💥')}))
      }, 100 * (t + 1))
    }
    return value
  },
  echo: (...args) => args,
  delay: async (input, delay = 100) => new Promise(resolve => setTimeout(async () => resolve(await input)), delay)
}

const onChange = (cid, value) => {
  // console.log('📩 Cell updated:', cid, value)
}
beforeEach(() => {
  qdata = djit.djit([[2, 10], [5, 20]], { onChange, context: { Main: { ...context } } })
})

describe('Delayed commands and postUpdate', () => {
  let qdata
  
  const context = {
    fireworks: input => `🎆 🌈 ✨ ${input} 🌟 💥 💫`,
    delayedBoom: (input, delay) => new Promise(resolve => setTimeout(() => resolve(async () => `💣 💣 💣 ${await input} 💣 💣 💣`), delay || 100)),
    listeners: input => (current, Data, postUpdate) => {
      setTimeout(() => {
        postUpdate(v => (false && console.log('cell invoked?', {input, current: v, Data})) || ({value: `${input}: ${v && v.listeners}`}))
        50
      })
      return `${input}: ${current && current.listeners}`
    },
    multiBoom: input => (current, Data, postUpdate) => {
      const value = input + ' 💥'
      for (let i = 0; i < 5; ++i) {
        const t = i
        setTimeout(() => {
          postUpdate(v => ({ value: value + [...Array((i + 1) * 2)].join('💥')}))
        }, 10 * (t + 1))
      }
      return value
    },
    echo: (...args) => args,
    delay: async (input, delay = 100) => new Promise(resolve => setTimeout(async () => resolve(await input)), delay)
  }
  
  beforeEach(() => {
    qdata = djit.djit([[2, 10], [5, 20]], { onChange, context: { Main: { ...context } } })
  })
  
  test('Execute function', () => {
    qdata.A1 = '=fireworks("Djit!")'
    expect(qdata.A1).toBe("🎆 🌈 ✨ Djit! 🌟 💥 💫")
  })

  test('Execute async function (promise)', async () => {
    qdata.A1 = '=delayedBoom("Awesome")'
    await sleep(200)
    expect(qdata.A1).toBe("💣 💣 💣 Awesome 💣 💣 💣")
  })

  test('Access own current value', async () => {
    qdata.A1 = '=listeners("Listeners")'
    await sleep(0)
    expect(qdata.A1).toBe("Listeners: undefined")

    qdata.A4 = '=A1:A3'
    qdata.A1 = '=listeners("Listeners")' // recompute the cell - "listeners" cell property will not trigger a recompute on its own

    expect(qdata.A1).toBe("Listeners: A4")
  })

  test('Update cells value using postUpdate w/ delay', async () => {
    qdata.A1 = '=multiBoom("Javascript!")'
    qdata.B1 = '=A1'
    expect(qdata.A1).toBe('Javascript! 💥')

    await sleep(120)
    expect(qdata.A1).toBe('Javascript! 💥💥💥💥💥💥💥💥💥💥')
    expect(qdata.B1).toBe('Javascript! 💥💥💥💥💥💥💥💥💥💥')
  })

})

describe('Arguments', () => {

  test('Basic arguments', async () => {
    qdata.C1 = '=echo("Hello", "World!")'
    expect(qdata.C1).toStrictEqual(['Hello', 'World!'])
  })

  test('Delayed arguments arguments', async () => {
    qdata.C1 = '=echo(delayedBoom("Yo", 50), "World!")'
    expect(qdata.C1).resolves.toStrictEqual(['💣 💣 💣 Yo 💣 💣 💣', 'World!'])
    await sleep(100)
    expect(qdata.C1[0]).toStrictEqual('💣 💣 💣 Yo 💣 💣 💣')
  })

  test('Nested Delayed arguments arguments', async () => {
    qdata.C1 = '=echo(delayedBoom(delayedBoom("Yo", 25), 25), "World!")'

    expect(qdata.C1).resolves.toStrictEqual(['💣 💣 💣 💣 💣 💣 Yo 💣 💣 💣 💣 💣 💣', 'World!'])
    await sleep(100)
    expect(qdata.C1[0]).toBe('💣 💣 💣 💣 💣 💣 Yo 💣 💣 💣 💣 💣 💣')

    qdata.C1 = '=echo(delayedBoom("A", 25), delayedBoom("B", 25))'
    await sleep(30)

    expect(qdata.C1).toStrictEqual(['💣 💣 💣 A 💣 💣 💣', '💣 💣 💣 B 💣 💣 💣'])

    qdata.F1 = '=delay(0)'
    await sleep(120)
    
    qdata.C2 = '=C1.F1'
    expect(qdata.C2).toBe('💣 💣 💣 A 💣 💣 💣')
  })

})


