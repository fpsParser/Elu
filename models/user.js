// models/user.js
const mongoose = require('mongoose');

// Схема пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Имя пользователя (уникальное)
    pin: { type: String, required: true }, // Пин-код
    contacts: [{ type: String }], // Список контактов (массив строк)
});

// Модель пользователя
const User = mongoose.model('User', userSchema);

module.exports = User;