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
    typeof opts.preserveTags === 'undefined' && (opts.preserveTags = true);

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
            var bemjsonNode = {},
                classes = attrs.class && attrs.class.split(/\s/);

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
                        return bemjsonNode.cls ? bemjsonNode.cls.push(entity) : bemjsonNode.cls = [entity];
                    }

                    var blockName = entity.block,
                        modFieldName = entity.elem ? 'elemMods' : 'mods';

                    naming.isBlock(entity) && visitedBlocksOnCurrentNode.push(blockName);

                    if (naming.isBlockMod(entity) && visitedBlocksOnCurrentNode.indexOf(blockName) < 0) {
                        onEntity({ block: blockName });
                    }

                    if (!bemjsonNode.block) {
                        for (var i in entity) {
                            bemjsonNode[i] = entity[i];
                        }
                        return;
                    }

                    if (
                        entity.block === bemjsonNode.block &&
                        entity.elem === bemjsonNode.elem &&
                        entity.modName
                    ) {
                        bemjsonNode[modFieldName] || (bemjsonNode[modFieldName] = {});
                        bemjsonNode[modFieldName][entity.modName] = entity.modVal;
                    } else { // build mixes
                        if (entity.modName) {
                            var mixes = bemjsonNode.mix,
                                currentMixingItem;

                            if (mixes) {
                                for (var i = 0; i < bemjsonNode.mix.length; i++) {
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

                        bemjsonNode.mix = (bemjsonNode.mix || []).concat(entity);
                    }
                }

                entities.forEach(onEntity);

                if (!bemjsonNode.block && bemjsonNode.mix && bemjsonNode.mix.length) {

                    var mainEntity = bemjsonNode.mix.shift();
                    if (!bemjsonNode.mix.length) delete bemjsonNode.mix;

                    for (var i in mainEntity) {
                        bemjsonNode[i] = mainEntity[i];
                    }
                }
            }

            delete attrs.class;

            var js = attrs['data-bem'] || attrs.onclick;

            if (js) {
                js = js.replace(/&quot;/g, '\'');
                js = js.replace(/^return/, '');
                js = vm.runInNewContext('(' + js + ')');

                var jsKey = naming.stringify(bemjsonNode);

                if (js[jsKey]) {
                    bemjsonNode.js = isEmpty(js[jsKey]) || js[jsKey];
                }

                delete js[jsKey];

                Object.keys(js).forEach(function(prop) {
                    bemjsonNode.mix && bemjsonNode.mix.forEach(function(entity, idx) {
                        if (entity.block && entity.block == prop) {
                            if (isEmpty(js[prop])) {
                                bemjsonNode.mix[idx].js = true;
                            } else {
                                bemjsonNode.mix[idx].js = js[prop];
                            }
                        }
                    });
                });

                delete attrs['data-bem'];
                delete attrs.onclick;
            }

            if (tag !== 'div' && (opts.preserveTags === true || !bemjsonNode.block)) {
                bemjsonNode.tag = tag;
            }

            if (!isEmpty(attrs)) bemjsonNode.attrs = attrs;

            if (isEmpty(bemjsonNode)) bemjsonNode = { content: '' };

            if (bemjsonNode.elem && bufArray.last() && bufArray.last().block === bemjsonNode.block) {
                delete bemjsonNode.block;
            }

            bufArray.push(bemjsonNode);
        },
        onclosetag: function(tag) {
            var bemjsonNode = bufArray.pop();

            ['content', 'mix'].forEach(function(field) {
                if (Array.isArray(bemjsonNode[field]) && bemjsonNode[field].length === 1) {
                    bemjsonNode[field] = bemjsonNode[field][0];
                }
            });

            bemjsonNode.cls && Array.isArray(bemjsonNode.cls) && (bemjsonNode.cls = bemjsonNode.cls.join(' '))

            if (bufArray.length === 0) {
                results.push(bemjsonNode);

                return;
            }

            var last = bufArray.last();
            if (!(last.content instanceof Array)) {
                last.content = [];
            }
            last.content.push(bemjsonNode);
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
