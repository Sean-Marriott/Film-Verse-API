import {ResultSetHeader} from "mysql2";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const insert = async(email: string,
                     firstName: string,
                     lastName: string,
                     password: string): Promise<ResultSetHeader> => {
    Logger.info('Adding user ${email} to the database');
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO user (email, first_name, last_name, password) VALUES (?, ?, ?, ?)'
    const [ result ] = await conn.query( query, [email, firstName, lastName, password]);
    await conn.release();
    return result;
}

export { insert }