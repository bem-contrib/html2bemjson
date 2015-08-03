module.exports = {
    content: [
        {
            block: 'button',
            mods: { islands: true, m: true }
        },
        {
            block: 'b1',
            mix: [{ block: 'b1', elem: 'e1' }],
            mods: { v1: true }
        },
        { block: 'b1', mods: { 'bool-mod': true } }
    ]
};
