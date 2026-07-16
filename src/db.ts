// Week 3
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  // mysql2's execute() (binary prepared-statement protocol) errors with
  // ER_WRONG_ARGUMENTS on `LIMIT ? OFFSET ?` placeholders on many MySQL
  // server versions. query() (text protocol) parameterizes the same way
  // without that limitation.
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}
