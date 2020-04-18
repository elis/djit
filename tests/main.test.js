const djit = require('../cjs/djit')

describe('Basic Arithmatic Operations', () => {
  let qdata

  beforeEach(() => {
    qdata = djit.djit()
    qdata.A1 = 2
    qdata.A2 = 5
    qdata.B1 = 10
    qdata.B2 = 20
  })

  test('" + " A1 to "=1 + 2" to equal 3', () => {
    qdata.A1 = '=1 + 2'
    expect(qdata.A1).toBe(3)
  })
  test('" + " adds A1 and A2', () => {
    qdata.A3 = '=A1 + A2'
    expect(qdata.A3).toBe(7)
  })
  test('" - " subtracts A1 from A2', () => {
    qdata.A3 = '=A2 - A1'
    expect(qdata.A3).toBe(3)
  })
  test('" * " multiplies A1 by A2', () => {
    qdata.A3 = '=A1 * A2'
    expect(qdata.A3).toBe(10);
  })
  test('" ^ " raise A1 to the power of A2', () => {
    qdata.A3 = '=A1 ^ A2'
    expect(qdata.A3).toBe(32);
  })
  test('" / " divides A1 by A2', () => {
    qdata.A3 = '=A2 / A1'
    expect(qdata.A3).toBe(2.5);
  })
  test('negative value', () => {
    qdata.A3 = '=-1'
    expect(qdata.A3).toBe(-1);
  })
})

describe("Advanced cell values", () => {
  let qdata

  beforeEach(() => {
    qdata = djit.djit()
    qdata.A1 = [1, 2, 3]
    qdata.A2 = { a: 5, b: 20, c: 100 }
  })

  test('A1 as array', () => {
    expect(qdata.A1).toStrictEqual([1, 2, 3])
  })
  test('A2 as object', () => {
    expect(qdata.A2).toStrictEqual({ a: 5, b: 20, c: 100 })
  })
  test('A1.0 array value', () => {
    qdata.A3 = '=A1.0'
    expect(qdata.A3).toBe(1)

    qdata.A3 = '=A1.1'
    expect(qdata.A3).toBe(2)

    qdata.A3 = '=A1.2'
    expect(qdata.A3).toBe(3)
  })
  test('A2 object value', () => {
    qdata.A3 = '=A2.a'
    expect(qdata.A3).toBe(5)

    qdata.A3 = '=A2.b'
    expect(qdata.A3).toBe(20)

    qdata.A3 = '=A2.c'
    expect(qdata.A3).toBe(100)
  })
  test('Nested object values', () => {
    qdata.A3 = {
      obj: {x: 100, y: 30},
      arr: [0.5, 0.2]
    }
    
    qdata.A4 = '=A3.obj'
    expect(qdata.A4).toStrictEqual({x: 100, y: 30})
    
    qdata.A4 = '=A3.obj.x'
    expect(qdata.A4).toBe(100)

    qdata.A4 = '=A3.arr'
    expect(qdata.A4).toStrictEqual([0.5, 0.2])

    qdata.A4 = '=A3.arr.0'
    expect(qdata.A4).toStrictEqual(0.5)
  })
  test('Nested object references', () => {
    qdata.A3 = {
      obj: {x: 100, y: 30},
      arr: [0.5, 0.2]
    }
    qdata.A4 = 'obj'
    
    qdata.A5 = '=A3.A4'
    expect(qdata.A5).toStrictEqual({x: 100, y: 30})

    qdata.A6 = 'x'
    qdata.A7 = '=(A3.A4).A6'
    expect(qdata.A7).toBe(100)
  })
  test('Nested array range references', () => {
    qdata.A4 = '=A1:A3'
    expect(qdata.A4).toStrictEqual([[[1, 2, 3]], [{a: 5, b: 20, c: 100}], [ undefined ]])

    qdata.A4 = '=(A1:A3).0'
    expect(qdata.A4).toStrictEqual([[1, 2, 3]])

    qdata.A4 = '=(A1:A3).0.0'
    expect(qdata.A4).toStrictEqual([1, 2, 3])

    qdata.A4 = '=(A1:A3).0.0.2'
    expect(qdata.A4).toBe(3)
  })
})