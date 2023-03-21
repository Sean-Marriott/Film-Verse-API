import {ResultSetHeader} from "mysql2";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";
import * as crypto from "crypto";

const insert = async(email: string,
                     firstName: string,
                     lastName: string,
                     password: string): Promise<ResultSetHeader> => {
    Logger.info('Adding user ${email} to the database');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const conn = await getPool().getConnection();
    const query = 'INSERT INTO user (email, first_name, last_name, password) VALUES (?, ?, ?, ?)'
    const [ result ] = await conn.query( query, [email, firstName, lastName, hash]);
    await conn.release();
    return result;
}

export { insert }