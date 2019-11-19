/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('banks', {
    id: 'id',
    name: { type: 'varchar(1000)', notNull: true },
    defaulturl: { type: 'varchar(1000)', notNull: true },
    queryselector: { type: 'text', notNull: true },
    cardname: { type: 'integer', notNull: true },
    cardpageselector: { type: 'text', notNull: true },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('banks');
};
