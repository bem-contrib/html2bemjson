module.exports =  [
    '<!DOCTYPE html>',
    {
        tag: 'html',
        content: [
            ' before comment ',
            '<!-- comment line 1\n        comment line 2\n        comment line 3 -->',
            ' after comment ',
            {
                block: 'b1',
                content: [
                    '<!-- comment before -->',
                    ' ololo ',
                    '<!-- comment after -->'
                ]
            }
        ]
    }
];
