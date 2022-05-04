const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "chat.db"));

// 获取到用户名对应的用户
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare("SELECT * FROM chat WHERE username=?");
    stmt.get(username, (err, row) => {
      if (err !== null) {
        reject(err);
      }
      if (row === {}) {
        resolve({});
      } else {
        resolve(row);
      }
    });
  });
}

// 将用户信息插入到数据库中
function insertUser(username, password) {
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
      .then((user) => {
        // 如果没有注册
        if (typeof user === "undefined") {
          const stmt = db.prepare(
            "INSERT INTO chat (username, password) VALUES (?,?)"
          );
          stmt.run(username, password);
          resolve({ code: 200 });
        } else {
          resolve({ code: -1 });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getUserByUsername,
  insertUser,
};
