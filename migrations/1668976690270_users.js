/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createTable('users', {
        id: {
            type: 'text',
            primaryKey: true,
            notNull: true,
            unique: true,
        },
        login: {
            type: 'text',
            notNull: true,
            unique: true,
        },
        secret: {
            type: 'text',
            notNull: true,
        },
    })
};

exports.down = pgm => {
    pgm.dropTable('users', {})
};
