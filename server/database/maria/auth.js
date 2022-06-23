const mariadb = require("mariadb");
const { GetActiveCode } = require("../../auth/AuthCode");

let GetConnection = () => {
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
};

let SeveAuthCode = async (username) => {
  let conn = await mariadb.createConnection(GetConnection());
  let { active_code, expire_code } = GetActiveCode();

  const rows = await conn.query("SELECT 1 FROM `user` WHERE username = ?", [
    username,
  ]);

  if (rows && rows.length == 0) {
    await conn.query(
      "INSERT INTO `user`(username, code, code_expire) value (?, ?, ?)",
      [username, active_code, expire_code]
    );
  } else {
    await conn.query(
      `UPDATE user SET code = ?, code_expire = ? WHERE username = ?`,
      [active_code, expire_code, username]
    );
  }
  conn.end();

  return active_code;
};

let GetAuthCode = async (username) => {
  let conn = await mariadb.createConnection(GetConnection());

  const rows = await conn.query(
    "SELECT code FROM `user` WHERE username = ? and code_expire > now()",
    [username]
  );
  conn.end();

  if (rows && rows.length == 0) {
    return 0;
  } else {
    return rows[0].code;
  }
};

let SaveUser = async (username, token, refresh_token) => {
  const conn = await mariadb.createConnection(GetConnection());

  const rows = await conn.query("SELECT 1 FROM `user` WHERE username = ?", [
    username,
  ]);
  if (rows && rows.length > 0) {
    await conn.query(
      `UPDATE user SET token = ?, refresh_token = ? WHERE username = ?`,
      [token, refresh_token, username]
    );
  }
  conn.end();
};

module.exports = { SeveAuthCode, GetAuthCode, SaveUser };
