# html2bemjson

Converts HTML to [BEMJSON](https://en.bem.info/technology/bemjson/).

## Installation
```sh
npm install html2bemjson --save
```

## Usage
```js
var html2bemjson = require('html2bemjson');
var html = '<div class="b1"><div class="b1__elem1"></div></div>';

html2bemjson.convert(html); // BEMJSON object

html2bemjson.stringify(html);
// {
//     block: 'b1',
//     content: [
//         {
//             block: 'b1',
//             elem: 'elem1'
//         }
//     ]
// }
```

### Options
Both methods can take options object as a second argument:
```js
require('html2bemjson').stringify('<div class="b1 b1--mod">', {
    preserveComments: false,
    naming: { elem: '__', mod: '--' }, // refer to https://en.bem.info/tools/bem/bem-naming/ for details
    indent: '\t'
});
```

For more examples please refer to `test` folder.
