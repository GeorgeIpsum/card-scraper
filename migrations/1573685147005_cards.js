/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('cards', {
    id: 'id',
    bankid: {
      type: 'integer',
      notNull: true,
      references: '"banks"',
      onDelete: 'cascade'
    },
    name: { type: 'varchar(1000)', notNull: true },
    defaulturl: { type: 'varchar(1000)', notNull: true },
    spending: 'jsonb',
    travel: 'jsonb',
    entertainment: 'jsonb',
    security: 'jsonb',
    other: 'jsonb',
  });
  pgm.createIndex('cards', 'bankid');
};

exports.down = (pgm) => {
  pgm.dropIndex('cards', 'bankid');
  pgm.dropTable('cards');
};
