var htmlparser = require('htmlparser2'),
    bemNaming = require('bem-naming'),
    stringifyObj = require('stringify-object'),
    vm = require('vm');

function isEmpty(obj) {
    for(var key in obj) {
        if(Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }

    return true;
}

var convert = function(html, opts) {
    opts || (opts = {});
    typeof opts.preserveComments === 'undefined' && (opts.preserveComments = true);
    typeof opts.preserveWrongClasses === 'undefined' && (opts.preserveWrongClasses = true);

    var naming = bemNaming(opts.naming),
        bufArray = [],
        results = [];

    bufArray.last = function() {
        return this[this.length - 1];
    };

    var parser = new htmlparser.Parser({
        onprocessinginstruction: function(name, data) {
            name === '!doctype' && results.push('<' + data + '>');
        },
        oncomment: function(data) {
            if (opts.preserveComments === false) return;

            var comment = '<!-- ' + data.trim() + ' -->',
                last = bufArray.last();

            if (!last) {
                results.push(comment);
                return;
            }

            last.content || (last.content = []);
            last.content.push(comment);
        },
        onopentag: function(tag, attrs) {
            var buf = {},
                classes = attrs.class && attrs.class.split(' '),
                block;

            if (classes && classes.length) {
                var entities = classes.map(function(cls, idx) {
                        var entity = naming.parse(cls);

                        if (!entity && opts.preserveWrongClasses) {
                            return cls;
                        }

                        return entity;
                    }),
                    visitedBlocksOnCurrentNode = [];

                function onEntity(entity) {
                    if (typeof entity === 'string') {
                        return buf.cls ? buf.cls.push(entity) : buf.cls = [entity];
                    }

                    var blockName = entity.block,
                        modFieldName = entity.elem ? 'elemMods' : 'mods';

                    if (naming.isBlock(entity)) {
                        visitedBlocksOnCurrentNode.push(blockName);

                        if (visitedBlocksOnCurrentNode.length === 1) {
                            block = entity;

                            for (var i in block) {
                                buf[i] = block[i];
                            }

                            return;
                        }
                    }

                    if (naming.isBlockMod(entity) && visitedBlocksOnCurrentNode.indexOf(blockName) < 0) {
                        onEntity({ block: blockName });
                    }

                    if (
                        entity.block === buf.block &&
                        entity.elem === buf.elem &&
                        entity.modName
                    ) {
                        buf[modFieldName] || (buf[modFieldName] = {});
                        buf[modFieldName][entity.modName] = entity.modVal;
                    } else { // build mixes
                        if (entity.modName) {
                            var mixes = buf.mix,
                                currentMixingItem;

                            if (mixes) {
                                for (var i = 0; i < buf.mix.length; i++) {
                                    if ((mixes[i].block === entity.block) && mixes[i].elem === entity.elem) {
                                        currentMixingItem = mixes[i];
                                    }
                                }
                            }

                            if (currentMixingItem) {
                                currentMixingItem[modFieldName] || (currentMixingItem[modFieldName] = {});
                                currentMixingItem[modFieldName][entity.modName] = entity.modVal;

                                return;
                            } else {
                                entity[modFieldName] = {};
                                entity[modFieldName][entity.modName] = entity.modVal;
                                delete entity.modName;
                                delete entity.modVal;
                            }
                        }

                        buf.mix = (buf.mix || []).concat(entity);
                    }
                }

                entities.forEach(onEntity);

                if (!buf.block && buf.mix.length) {

                    var mainEntity = buf.mix.shift();
                    if (!buf.mix.length) delete buf.mix;

                    for (var i in mainEntity) {
                        buf[i] = mainEntity[i];
                    }
                }
            }

            delete attrs.class;

            var js = attrs['data-bem'] || attrs.onclick;

            if (js) {
                js = js.replace(/&quot;/g, '\'');
                js = js.replace(/^return/, '');
                js = vm.runInNewContext('(' + js + ')');

                if (js[block.block]) {
                    if (isEmpty(js[block.block])) {
                        buf.js = true;
                    } else {
                        buf.js = js[block.block];
                    }
                }
                delete js[block.block];

                Object.keys(js).forEach(function(prop) {
                    buf.mix.forEach(function(entity, idx) {
                        if (entity.block && entity.block == prop) {
                            if (isEmpty(js[prop])) {
                                buf.mix[idx].js = true;
                            } else {
                                buf.mix[idx].js = js[prop];
                            }
                        }
                    });
                });

                delete attrs['data-bem'];
                delete attrs.onclick;
            }

            if (tag != 'div') {
                buf.tag = tag;
            }

            if (!isEmpty(attrs)) buf.attrs = attrs;

            if (isEmpty(buf)) buf = { content: '' };

            bufArray.push(buf);
        },
        onclosetag: function(tag) {
            var buf = bufArray.pop();

            if (bufArray.length === 0) {
                results.push(buf);

                return;
            }

            var last = bufArray.last();
            if (!(last.content instanceof Array)) {
                last.content = [];
            }
            last.content.push(buf);
        },
        ontext: function(text) {
            if (text.match(/(^[\s\n]+$)/g)) return;

            var last = bufArray.last();

            if (!last || !last.tag || last.tag !== 'pre') {
                text = text.replace(/^(\s*)(.*?)(\s*)$/gm, function(source, before, content, after) {
                    before && (content = ' ' + content);
                    after && (content = content + ' ');
                    return content;
                });
            }

            if (!last) {
                results.push(text);
                return;
            }

            last.content || (last.content = []);
            last.content.push(text);
        }
    });

    parser.write(html);
    parser.end();

    return results.length === 1 ? results[0] : results;
};

function stringify(html, opts) {
    opts || (opts = {});
    opts.indent || (opts.indent = '    ');

    return stringifyObj(convert(html, opts), opts);
};

module.exports = {
    convert: convert,
    stringify: stringify
};
