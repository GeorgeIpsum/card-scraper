/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('parsemethod', ['JS', 'HTML']);
  pgm.createTable('banks', {
    id: 'id',
    name: { type: 'varchar(1000)', notNull: true },
    defaultUrl: { type: 'varchar(1000)', notNull: true },
    parseMethod: {
      type: 'parsemethod',
      notNull: true,
      default: 'HTML'
    },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('banks');
  pgm.dropType('parseMethod');
};
