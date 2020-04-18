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

describe('Integers', () => {

  test('1', () => {
    qdata.A1 = '=1'
    expect(qdata.A1).toBe(1)

    qdata.A1 = '=-1'
    expect(qdata.A1).toBe(-1)
  })
  test('20', () => {
    qdata.A1 = '=20'
    expect(qdata.A1).toBe(20)

    qdata.A1 = '=-20'
    expect(qdata.A1).toBe(-20)
  })
  test('300', () => {
    qdata.A1 = '=300'
    expect(qdata.A1).toBe(300)

    qdata.A1 = '=-300'
    expect(qdata.A1).toBe(-300)
  })
  test('4000, 4,000', () => {
    qdata.A1 = '=4000'
    expect(qdata.A1).toBe(4000)

    qdata.A1 = '=4,000'
    expect(qdata.A1).toBe(4000)

    qdata.A1 = '=-4000'
    expect(qdata.A1).toBe(-4000)

    qdata.A1 = '=-4,000'
    expect(qdata.A1).toBe(-4000)
  })
  test('50000, 50,000', () => {
    qdata.A1 = '=50000'
    expect(qdata.A1).toBe(50000)

    qdata.A1 = '=50,000'
    expect(qdata.A1).toBe(50000)

    qdata.A1 = '=-50000'
    expect(qdata.A1).toBe(-50000)

    qdata.A1 = '=-50,000'
    expect(qdata.A1).toBe(-50000)
  })
  test('600000, 600,000', () => {
    qdata.A1 = '=600000'
    expect(qdata.A1).toBe(600000)

    qdata.A1 = '=600,000'
    expect(qdata.A1).toBe(600000)

    qdata.A1 = '=-600000'
    expect(qdata.A1).toBe(-600000)

    qdata.A1 = '=-600,000'
    expect(qdata.A1).toBe(-600000)
  })
  test('7000000, 7,000,000', () => {
    qdata.A1 = '=7000000'
    expect(qdata.A1).toBe(7000000)

    qdata.A1 = '=7,000,000'
    expect(qdata.A1).toBe(7000000)

    qdata.A1 = '=-7000000'
    expect(qdata.A1).toBe(-7000000)

    qdata.A1 = '=-7,000,000'
    expect(qdata.A1).toBe(-7000000)
  })
  test('80000000, 80,000,000', () => {
    qdata.A1 = '=80000000'
    expect(qdata.A1).toBe(80000000)

    qdata.A1 = '=80,000,000'
    expect(qdata.A1).toBe(80000000)

    qdata.A1 = '=-80000000'
    expect(qdata.A1).toBe(-80000000)

    qdata.A1 = '=-80,000,000'
    expect(qdata.A1).toBe(-80000000)
  })
  test('900000000, 900,000,000', () => {
    qdata.A1 = '=900000000'
    expect(qdata.A1).toBe(900000000)

    qdata.A1 = '=900,000,000'
    expect(qdata.A1).toBe(900000000)

    qdata.A1 = '=-900000000'
    expect(qdata.A1).toBe(-900000000)

    qdata.A1 = '=-900,000,000'
    expect(qdata.A1).toBe(-900000000)
  })
  test('1000000000, 1,000,000,000', () => {
    qdata.A1 = '=1000000000'
    expect(qdata.A1).toBe(1000000000)

    qdata.A1 = '=1,000,000,000'
    expect(qdata.A1).toBe(1000000000)

    qdata.A1 = '=-1000000000'
    expect(qdata.A1).toBe(-1000000000)

    qdata.A1 = '=-1,000,000,000'
    expect(qdata.A1).toBe(-1000000000)
  })
  test('20000000000, 20,000,000,000', () => {
    qdata.A1 = '=20000000000'
    expect(qdata.A1).toBe(20000000000)

    qdata.A1 = '=20,000,000,000'
    expect(qdata.A1).toBe(20000000000)

    qdata.A1 = '=-20000000000'
    expect(qdata.A1).toBe(-20000000000)

    qdata.A1 = '=-20,000,000,000'
    expect(qdata.A1).toBe(-20000000000)
  })
  test('300000000000, 300,000,000,000', () => {
    qdata.A1 = '=300000000000'
    expect(qdata.A1).toBe(300000000000)

    qdata.A1 = '=300,000,000,000'
    expect(qdata.A1).toBe(300000000000)

    qdata.A1 = '=-300000000000'
    expect(qdata.A1).toBe(-300000000000)

    qdata.A1 = '=-300,000,000,000'
    expect(qdata.A1).toBe(-300000000000)
  })
})

describe('Floats', () => {

  test('0.1', () => {
    qdata.A1 = '=0.1'
    expect(qdata.A1).toBe(0.1)

    qdata.A1 = '=-0.1'
    expect(qdata.A1).toBe(-0.1)
  })
  test('0.02', () => {
    qdata.A1 = '=0.02'
    expect(qdata.A1).toBe(0.02)

    qdata.A1 = '=-0.02'
    expect(qdata.A1).toBe(-0.02)
  })
  test('0.003', () => {
    qdata.A1 = '=0.003'
    expect(qdata.A1).toBe(0.003)

    qdata.A1 = '=-0.003'
    expect(qdata.A1).toBe(-0.003)
  })
  test('0.0004', () => {
    qdata.A1 = '=0.0004'
    expect(qdata.A1).toBe(0.0004)

    qdata.A1 = '=-0.0004'
    expect(qdata.A1).toBe(-0.0004)
  })
  test('0.00005', () => {
    qdata.A1 = '=0.00005'
    expect(qdata.A1).toBe(0.00005)

    qdata.A1 = '=-0.00005'
    expect(qdata.A1).toBe(-0.00005)
  })
  test('0.000006', () => {
    qdata.A1 = '=0.000006'
    expect(qdata.A1).toBe(0.000006)

    qdata.A1 = '=-0.000006'
    expect(qdata.A1).toBe(-0.000006)
  })
  test('0.0000007', () => {
    qdata.A1 = '=0.0000007'
    expect(qdata.A1).toBe(0.0000007)

    qdata.A1 = '=-0.0000007'
    expect(qdata.A1).toBe(-0.0000007)
  })
  test('0.00000008', () => {
    qdata.A1 = '=0.00000008'
    expect(qdata.A1).toBe(0.00000008)

    qdata.A1 = '=-0.00000008'
    expect(qdata.A1).toBe(-0.00000008)
  })
  test('0.000000009', () => {
    qdata.A1 = '=0.000000009'
    expect(qdata.A1).toBe(0.000000009)

    qdata.A1 = '=-0.000000009'
    expect(qdata.A1).toBe(-0.000000009)
  })
  test('0.0000000001', () => {
    qdata.A1 = '=0.0000000001'
    expect(qdata.A1).toBe(0.0000000001)

    qdata.A1 = '=-0.0000000001'
    expect(qdata.A1).toBe(-0.0000000001)
  })
  test('0.00000000002', () => {
    qdata.A1 = '=0.00000000002'
    expect(qdata.A1).toBe(0.00000000002)

    qdata.A1 = '=-0.00000000002'
    expect(qdata.A1).toBe(-0.00000000002)
  })
  test('0.000000000003', () => {
    qdata.A1 = '=0.000000000003'
    expect(qdata.A1).toBe(0.000000000003)

    qdata.A1 = '=-0.000000000003'
    expect(qdata.A1).toBe(-0.000000000003)
  })
})

describe("Large numbers", () => {
  test('10000000000000000000000000000000000000000001', () => {
    qdata.A1 = '=10000000000000000000000000000000000000000001'
    expect(qdata.A1) .toBe(10000000000000000000000000000000000000000001)
  })

  test('10000000000000000000000000000000000000000000000000000000000000000000000000000000000001', () => {
    qdata.A1 = '=10000000000000000000000000000000000000000000000000000000000000000000000000000000000001'
    expect(qdata.A1) .toBe(10000000000000000000000000000000000000000000000000000000000000000000000000000000000001)
  })
  test('1^2', () => {
    qdata.A1 = '=' + 1e6
    expect(qdata.A1) .toBe(1e6)

    qdata.A1 = '=' + 1e-16
    expect(qdata.A1) .toBe(1e-16)

    qdata.A1 = '=' + 10e32
    expect(qdata.A1) .toBe(10e32)

    qdata.A1 = '=' + 10e-128
    expect(qdata.A1) .toBe(10e-128)

    for (let i = 0; i < 70; ++i) {
      const o = Math.pow(2, i)

      qdata.A1 = '=' + o
      expect(qdata.A1) .toBe(o)
    }

    for (let i = 0; i > -70; --i) {
      const o = Math.pow(2, i)

      qdata.A1 = '=' + o
      expect(qdata.A1) .toBe(o)
    }
  })
})