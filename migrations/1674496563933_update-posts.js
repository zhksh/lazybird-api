/* eslint-disable camelcase */

const { alterTable } = require("node-pg-migrate/dist/operations/tables");
const { text } = require("stream/consumers");

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('posts', {
        temperature: {
            type: 'real'
        },
        mood: {
            type: 'text',
        }
    })
};

exports.down = pgm => {
    pgm.dropColumns('posts', ['temperature','mood'])
};
