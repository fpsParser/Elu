// models/message.js
const mongoose = require('mongoose');

// Схема сообщения
const messageSchema = new mongoose.Schema({
    from: { type: String, required: true }, // Отправитель
    to: { type: String, required: true },   // Получатель
    message: { type: String, required: true }, // Текст сообщения
    createdAt: { type: Date, default: Date.now }, // Время создания
});

// Модель сообщения
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;