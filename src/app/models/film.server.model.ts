import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from "mysql2";

const getAll = async (): Promise<Film[]> => {
    Logger.info('Getting all films from the database');
    const conn = await getPool().getConnection();
    const query = 'select * from film';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
};

export { getAll }