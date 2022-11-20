/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createSchema('users')
};

exports.down = pgm => {
    pgm.dropSchema('users')
};
