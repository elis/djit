# djit

Excel-like Javascript Object

Create an Excel-like object in Javascript that automagically computes itself whenever updated.

Basically a programitacally accessible Excel Spreadsheet.

Example:

```js
import { djit } from 'djit'

const qdata = djit([[150, 33], [12.55, 'Yo!']])
/*
  qdata = {
    A1: { input: 150, type: 'integer', value: 150, listeners: [ 'A3' ] },
    B1: { input: 33, type: 'integer', value: 33 },
    A2: { input: 12.55, type: 'float', value: 12.55, listeners: [ 'A3' ] },
    B2: { input: 'Yo!', type: 'string', value: 'Yo!' }
  }
*/
qdata.toArray()
// [ [ 150, 33 ], [ 12.55, 'Yo!' ] ]

qdata.A3 = '=A1 + A2'
qdata.toArray()
// [ [ 150, 33 ], [ 12.55, 'Yo!' ], [ 162.55 ] ]

qdata.B3 = '=A3 / 6'
qdata.toArray()
// [ [ 150, 33 ], [ 12.55, 'Yo!' ], [ 162.55, 27.09166666666667 ] ]

console.log(qdata.B3) // 27.09166666666667
```

## Installation and Usage

Add djit to your project:

```sh
$ yarn add djit
```

Import and initialize:

```js
import { djit } from 'djit'
```

Create a new sheet object:

```js
const data = [[], []]
const context = { Math }
// Math.* functions are available to be used in cells like so: `data.B1 = '=floor(random() * 100)'`

const onChange = (key, value, Data) => {
  console.log('Djit updated:', key, 'New value:', value)
}
// onChange will fire every time a cell value is updated

const qdata = djit(data, { context, onChange })
```

Interact with the data:

```js
qdata.A1 = 100
qdata.B1 = 200
qdata.C1 = '=A1 + B1'
```

Explore data:

```js
console.log('C1 cell:', qdata.C1) // 300

console.log('As array:', qdata.toArray()) // As array: [ [ 100, 200, 300 ] ]
```

