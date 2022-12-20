/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
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
    }),
    pgm.createTable('comments', {
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
        post_id: {
            type: 'text',
            notNull: true,
            references: 'posts',
            onDelete: 'cascade'
        },
        content: { type: 'text', notNull: true },
        timestamp: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    })
    pgm.createTable('likes', {
        username: {
            type: 'text',
            notNull: true,
            primaryKey: true,
            references: 'users',
            onDelete: 'cascade'
        },
        post_id: {
            type: 'text',
            notNull: true,
            primaryKey: true,
            references: 'posts',
            onDelete: 'cascade'
        }
    })
};

exports.down = pgm => {
    pgm.dropTable('likes', {})
    pgm.dropTable('comments', {})
    pgm.dropTable('posts', {})
};
