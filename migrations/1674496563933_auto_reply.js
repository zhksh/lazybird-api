/* eslint-disable no-undef */
/* eslint-disable camelcase */

exports.up = pgm => {
    pgm.createTable('auto_replies', {
        post_id: {
            type: 'text',
            notNull: true,
            primaryKey: true,
            references: 'posts',
            onDelete: 'cascade',
        },
        mood: {
            type: 'text',
            notNull: true,
        },
        temperature: {
            type: 'real',
            notNull: true,
        },
        history_length: {
            type: 'integer',
            notNull: true,
        },
    })
};

exports.down = pgm => {
    pgm.dropTable('auto_replies', {})
};
