/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createExtension('fuzzystrmatch')
};

exports.down = pgm => {
    pgm.dropExtension('fuzzystrmatch')
};
