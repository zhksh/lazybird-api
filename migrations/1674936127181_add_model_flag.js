/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.addColumn('auto_replies', {
        ours: {
            type: 'text'
        }
    })
};

exports.down = pgm => {
    pgm.dropColumn('auto_replies', ['ours'])
};