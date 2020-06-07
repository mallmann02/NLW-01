import knex from 'knex';
import path from 'path';

const connection = knex({
    client: 'sqlite3',
    connection:{
        filename: path.resolve(__dirname, 'database.sqlite'),
    },

    pool: {min:0, max:80},

    useNullAsDefault:true
});

export default connection;