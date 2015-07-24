# html2bemjson

## Installation
```sh
npm install html2bemjson --save
```

## Usage
```js
var html2bemjson = require('html2bemjson');
var html = '<div class="b1"><div class="b1__elem1"></div></div>';

html2bemjson.convert(html); // { block: 'b1', content: [ { block: 'b1', elem: 'elem1' } ] }
```

For more examples please refer to `test` folder.
