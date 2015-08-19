module.exports = {
    content: [
        {
            block: 'button',
            mods: { theme: 'islands', size: 'm' }
        },
        {
            block: 'b1',
            mix: { block: 'b1', elem: 'e1', elemMods: { m1: 'v1' } },
        },
        { block: 'b1', mods: { 'bool-mod': true } }
    ]
};
