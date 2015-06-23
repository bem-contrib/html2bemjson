var inspect = require('util').inspect,
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    html2bemjson = require('..'),
    testsNumber = 1;

while (testsNumber) {
    var html = fs.readFileSync(path.resolve(__dirname, './test' + testsNumber + '.html')),
        reference = require('./reference' + testsNumber + '.bemjson.js'),
        result = html2bemjson.convert(html);

    try {
        assert.deepEqual(result, reference, 'Test #' + testsNumber + ' failed');
    } catch(err) {
        console.log(err.message);
        console.log('\nconverted BEMJSON\n', inspect(result, { depth: null }));
        console.log('\nreference\n', inspect(reference, { depth: null }));
        throw new Error(err);
    }

    testsNumber--;
}
