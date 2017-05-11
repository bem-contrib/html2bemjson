var inspect = require('util').inspect,
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    html2bemjson = require('..');

glob('test/test*.html', function(globErr, testFiles) {
    if (globErr) {
        throw globErr;
    }

    testFiles.forEach(function(testFile) {
        var baseName = path.basename(testFile),
            html = fs.readFileSync(path.resolve(testFile)),
            testNumber = Number(/test(\d+)\.html/.exec(baseName)[1]),
            reference = require('./reference' + testNumber + '.bemjson.js'),
            opts = {};

        if (testNumber === 4) {
            opts.naming = {
                elem: '__',
                mod: '--'
            }
        }

        var result = html2bemjson.convert(html, opts);

        try {
            assert.deepEqual(result, reference, 'Test #' + testNumber + ' failed');
        } catch(err) {
            console.log(err.message);
            console.log('\nconverted BEMJSON\n', html2bemjson.stringify(html, opts));
            console.log('\nreference\n', inspect(reference, { depth: null }));
            throw err;
        }
    });
});
