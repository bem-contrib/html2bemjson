var inspect = require('util').inspect,
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    html2bemjson = require('..'),
    testsNumber = 5;

while (testsNumber) {
    var html = fs.readFileSync(path.resolve(__dirname, './test' + testsNumber + '.html')),
        reference = require('./reference' + testsNumber + '.bemjson.js'),
        opts = {};

    if (testsNumber === 4) {
        opts.naming = {
            elem: '__',
            mod: '--'
        }
    }

    var result = html2bemjson.convert(html, opts);

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
