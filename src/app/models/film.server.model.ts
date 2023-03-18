import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from "mysql2";

const getAll = async (
    q: string,
    genreId: string,
    ageRating: string,
    directorId: string,
    reviewerId: string,
    sortBy: string
    ): Promise<Film[]> => {
    const ageRatings = ageRating.split(',');
    const genreIds = genreId.split(',');
    const params: any[] = ['%' + q + '%', '%' + q + '%'];
    const conn = await getPool().getConnection();
    let query = 'SELECT film.id AS filmId, ' +
        'film.title, ' +
        'film.genre_id AS genreId, ' +
        'film.director_id AS directorId, ' +
        'user.first_name AS directorFirstName, ' +
        'user.last_name AS directorLastName, ' +
        'film.release_date AS releaseDate, ' +
        'film.age_rating AS ageRating, ' +
        '(SELECT CAST(IFNULL(ROUND(AVG(rating), 1),0) AS float) FROM film_review WHERE film.id = film_review.film_id) AS rating ' +
        'FROM film ' +
        'LEFT JOIN film_review on film.id = film_review.film_id ' +
        'LEFT JOIN user ON film.director_id = user.id ' +
        'WHERE (film.title LIKE ? OR film.description LIKE ?)';

    if (directorId !== "") {
        query += ' AND (user.id = ?) ';
        params.push(parseInt(directorId, 10));
    }

    if (reviewerId !== "") {
        query += ' AND (film_review.user_id = ?) ';
        params.push(parseInt(reviewerId, 10));
    }

    if (genreId !== "") {
        query += ' AND ('
        for (let i=0; i<genreIds.length; i++){
            if (i !== genreIds.length-1) {
                query += 'film.genre_id = "' + genreIds[i] +'" OR '
            } else {
                query += 'film.genre_id = "' + genreIds[i] + '") '
            }
        }
    }

    if (ageRating !== "") {
        query += ' AND ('
        for (let i=0; i<ageRatings.length; i++){
            if (i !== ageRatings.length-1) {
                query += 'film.age_rating = "' + ageRatings[i] +'" OR '
            } else {
                query += 'film.age_rating = "' + ageRatings[i] + '") '
            }
        }
    }

    query += 'GROUP BY film.id ORDER BY ';

    let sortMethod = 'film.release_date ASC';

    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            sortMethod = 'film.title ASC';
            break;
        case "ALPHABETICAL_DESC":
            sortMethod = 'film.title DESC';
            break;
        case "RELEASED_DESC":
            sortMethod = 'film.release_date DESC';
            break;
        case "RATING_ASC":
            sortMethod = 'RATING ASC';
            break;
        case "RATING_DESC":
            sortMethod = 'RATING DESC';
            break;
    }

    query += sortMethod + ', film.id ASC';
    const [ rows ] = await conn.query( query, params );
    await conn.release();

    return rows;
};

export { getAll }