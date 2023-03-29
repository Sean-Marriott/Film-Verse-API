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

const getByEmail = async(email: string): Promise<User[]> => {
    Logger.info('Getting user ${email} from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?'
    const [ rows ] = await conn.query( query, [ email ] );
    await conn.release();
    return rows;
}

const getAllById = async(id: string): Promise<User[]> => {
    Logger.info('Getting user ${email} from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE id = ?'
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}
const getById = async(id: string, loggedIn: boolean): Promise<User[]> => {
    Logger.info('Getting user ${email} from the database');
    const conn = await getPool().getConnection();
    let query = 'SELECT first_name AS firstName, last_name AS lastName FROM user WHERE id = ?'
    if (loggedIn) {query = 'SELECT email, first_name AS firstName, last_name AS lastName FROM user WHERE id = ?'}
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const insertToken = async(userId: number, token: string): Promise<ResultSetHeader> => {
    Logger.info('Adding token ${token} to user ${userId} to the database');
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?'
    const [ result ] = await conn.query( query, [token, userId]);
    await conn.release();
    return result;
}

const findUserByToken = async(token: string): Promise<User[]> => {
    Logger.info('Getting user ${token} from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE auth_token = ?'
    const [ rows ] = await conn.query( query, [ token ] );
    await conn.release();
    return rows;
}

const editUser = async(id: string,
                       email: string,
                       firstName: string,
                       lastName: string,
                       password: string): Promise<ResultSetHeader> => {
    Logger.info('Editing user ${userId} in the database');
    const params: [string, string][] = [];
    if (email !== "") { params.push(["email", email]) }
    if (firstName !== "") { params.push(["first_name", firstName]) }
    if (lastName !== "") { params.push(["last_name", lastName]) }
    if (password !== "") { params.push(["password", password]) }
    if (params.length === 0) { return null;}
    const conn = await getPool().getConnection();
    let query = 'UPDATE user SET';
    for (let i=0; i<params.length; i++) {
        if (i === params.length - 1) {
           query += ' ' + params[i][0] + ' = "' + params[i][1] + '"'
        } else {
           query += ' ' + params[i][0] + ' = "' + params[i][1] + '",'
        }
    }
    query += " WHERE id = " + id;
    const [ result ] = await conn.query( query );
    await conn.release();
    return result;
}

const updateImage = async(id: string, ImageFileName: string): Promise<ResultSetHeader> => {
    Logger.info('Updating image for user ${userId} in the database');
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = ? WHERE id = ?'
    const [ result ] = await conn.query( query, [ ImageFileName, id ]);
    await conn.release();
    return result;
}

export { insert, getByEmail, getAllById, getById, insertToken, findUserByToken, editUser, updateImage }