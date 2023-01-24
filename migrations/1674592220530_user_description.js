/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.addColumn('users', {
        bio: {
            type: 'text'
        }
    })
};

exports.down = pgm => {
    pgm.dropColumn('users', ['bio'])
};
