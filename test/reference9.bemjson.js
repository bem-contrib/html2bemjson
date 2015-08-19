module.exports = [
    '<!doctype html>',
    {
        tag: 'html',
        content: [
            {
                tag: 'head',
                content: [
                    {
                        tag: 'meta',
                        attrs: {
                            charset: 'utf-8'
                        }
                    },
                    {
                        tag: 'title',
                        content: 'title'
                    }
                ]
            },
            {
                tag: 'body',
                content: [
                    ' some text\nsome other text ',
                    {
                        content: [
                            ' text ',
                            {
                                tag: 'b',
                                content: 'strong text'
                            },
                            ' more text\n text more text',
                            {
                                tag: 'br'
                            },
                            ' text more text '
                        ]
                    }
                ]
            }
        ]
    }
];
