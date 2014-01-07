var htmlparser = require('htmlparser2');

function isEmpty(obj) {
    for(var key in obj) {
        if(Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }

    return true;
}

function parseBemEntity(entity) {
    var elemModArr = /(.*)__(.*)_(.*)_(.*)/.exec(entity),
        elemArr,
        modArr,
        elem,
        elemMod,
        mod,
        block;

    if (elemModArr) {
        elemMod = {};

        elemMod[elemModArr[3]] = elemModArr[4];

        return {
            block: elemModArr[1],
            elem: elemModArr[2],
            elemMods: elemMod
        };
    }

    elemArr = /(.*)__(.*)/.exec(entity);

    if (elemArr) {
        return {
            block: elemArr[1],
            elem: elemArr[2]
        };
    }

    modArr = /(.*)_(.*)_(.*)/.exec(entity);

    if (modArr) {
        mod = {};
        mod[modArr[2]] = modArr[3];

        return {
            block: modArr[1],
            mods: mod
        };
    }

    return { block: entity };

}

var convert = function(html) {
    var bufArray = [],
        results = {};

    bufArray.last = function() {
        return this[this.length - 1];
    };

    var parser = new htmlparser.Parser({
        onopentag: function(tag, attrs) {
            var buf = {},
                classes = attrs.class && attrs.class.split(' '),
                block = classes && parseBemEntity(classes.shift()),
                i;

            for (i in block) {
                buf[i] = block[i];
            }

            if (classes && classes.length) {
                buf.mix = classes.map(parseBemEntity);
            }

            buf.tag = tag;
            delete attrs.class;

            if (!isEmpty(attrs)) buf.attrs = attrs;

            bufArray.push(buf);
        },
        onclosetag: function(tag) {
            var buf = bufArray.pop();
            if (bufArray.length === 0) {
                return results = buf;
            }
            var last = bufArray.last();
            if (!(last.content instanceof Array)) {
                last.content = [];
            }
            last.content.push(buf);
        },
        ontext: function(text) {
            var last = bufArray.last();

            if (!last) return;

            last.content = last.content || [];
            last.content.push(text);
        }
    });

    parser.write(html);
    parser.end();

    return results;
};

exports.convert = convert;
