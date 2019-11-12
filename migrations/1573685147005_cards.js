/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('cards', {
    id: 'id',
    bankId: {
      type: 'integer',
      notNull: true,
      references: '"banks"',
      onDelete: 'cascade'
    },
    name: { type: 'varchar(1000)', notNull: true },
    info: { type: 'text' }
  });
  pgm.createIndex('cards', 'bankId');
};

exports.down = (pgm) => {
  pgm.dropTable('cards');
};
