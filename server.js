import express from "express";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import cors from "cors";
import bodyParser from "body-parser";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();              // ✅ Сначала создаём приложение
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Настраиваем раздачу всех файлов из текущей директории (HTML, CSS, IMG)
app.use(express.static(__dirname));

// === Инициализация базы ===
let db;
(async () => {
  db = await open({
    filename: "./database.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      product TEXT,
      phone TEXT,
      address TEXT,
      date TEXT
    );
  `);
  console.log("✅ База данных готова");
})();

// === Регистрация ===
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: "Введите все поля" });

  const existing = await db.get("SELECT * FROM users WHERE username = ?", username);
  if (existing)
    return res.json({ success: false, message: "Пользователь уже существует" });

  const hash = await bcrypt.hash(password, 10);
  await db.run("INSERT INTO users (username, password) VALUES (?, ?)", username, hash);
  res.json({ success: true, message: "Регистрация успешна!" });
});

// === Авторизация ===
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE username = ?", username);
  if (!user)
    return res.json({ success: false, message: "Пользователь не найден" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.json({ success: false, message: "Неверный пароль" });

  res.json({ success: true, message: `Добро пожаловать, ${username}!` });
});

// === Сохранение заказа ===
app.post("/order", async (req, res) => {
  const { user, product, phone, address } = req.body;
  if (!user || !product || !phone || !address)
    return res.json({ success: false, message: "Все поля обязательны" });

  const date = new Date().toLocaleString("ru-RU");
  await db.run(
    "INSERT INTO orders (user, product, phone, address, date) VALUES (?, ?, ?, ?, ?)",
    user, product, phone, address, date
  );

  res.json({ success: true, message: "Заказ успешно оформлен!" });
});

app.listen(PORT, () => console.log(`🚀 Сервер запущен: http://localhost:${PORT}`));
