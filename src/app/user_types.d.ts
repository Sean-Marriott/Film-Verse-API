type User = {
    /**
     * User's id as defined by the database
     */
    id: number;
    /**
     * User's email as entered when created
     */
    email: string,
    /**
     * User's firstName as entered when created
     */
    firstName: string,
    /**
     * User's lastName as entered when created
     */
    lastName: string,
    /**
     * Hash of password as created when entered
     */
    password: string,
    /**
     * Authentication token as created when the user logs in
     */
    token: string
}