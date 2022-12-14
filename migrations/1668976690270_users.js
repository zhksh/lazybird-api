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
    }),
    pgm.createTable('followers', {
        username: {
            type: 'text',
            primaryKey: true,
            references: 'users',
            notNull: true,
            onDelete: 'cascade',
        },
        follows_username: {
            type: 'text',
            primaryKey: true,
            references: 'users',
            notNull: true,
            onDelete: 'cascade',
        },
    }),
    pgm.createTable('posts', {
        id: {
            type: 'text',
            primaryKey: true,
            notNull: true,
            unique: true,
        },
        username: {
            type: 'text',
            notNull: true,
            references: 'users',
            onDelete: 'cascade'
        },
        content: { type: 'text', notNull: true },
        auto_complete: { type: 'boolean', notNull: true},
        timestamp: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    })
};

exports.down = pgm => {
    pgm.dropTable('followers', {})
    pgm.dropTable('users', {})
};
