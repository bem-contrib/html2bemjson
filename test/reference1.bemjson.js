module.exports = {
    block: 'b1',
    content: {
        block: 'b2',
        mix: { block: 'b1', elem: 'e1' },
        content: {
            block: 'b1',
            elem: 'e2',
            tag: 'span',
            content: 'test'
        }
    }
};
