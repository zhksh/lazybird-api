/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createTable('users', {
        username: {
            type: 'text',
            primaryKey: true,
            notNull: true,
            unique: true,
        },
        secret: {
            type: 'text',
            notNull: true,
        },
        icon_id: {
            type: 'text',
            notNull: true,
        },
        display_name: {
            type: 'text',
        },
    })
};

exports.down = pgm => {
    pgm.dropTable('users', {})
};
