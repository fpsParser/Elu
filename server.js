const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздаем статические файлы (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Для обработки JSON-запросов
app.use(express.json());

// Загрузка пользователей из файла
let users = [];
const usersFilePath = path.join(__dirname, 'users.json');

if (fs.existsSync(usersFilePath)) {
    users = JSON.parse(fs.readFileSync(usersFilePath));
}

// Сохранение пользователей в файл
function saveUsers() {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Регистрация
app.post('/register', (req, res) => {
    const { username, pin } = req.body;

    if (users.some(u => u.username === username)) {
        res.json({ success: false, message: 'Ник уже занят' });
        return;
    }

    users.push({ username, pin, contacts: [], messages: {} });
    saveUsers(); // Сохраняем изменения
    res.json({ success: true });
});

// Авторизация
app.post('/login', (req, res) => {
    const { username, pin } = req.body;

    const user = users.find(u => u.username === username);

    if (user) {
        if (user.pin === pin) {
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Неверный пин-код' });
        }
    } else {
        res.json({ success: false, message: 'Пользователь не найден' });
    }
});

// Поиск пользователя
app.post('/search-user', (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);

    if (user) {
        res.json({ success: true, user });
    } else {
        res.json({ success: false, message: 'Пользователь не найден' });
    }
});

// Добавление пользователя в контакты
app.post('/add-contact', (req, res) => {
    const { username, contact } = req.body;

    const user = users.find(u => u.username === username);
    const contactUser = users.find(u => u.username === contact);

    if (!user || !contactUser) {
        res.json({ success: false, message: 'Пользователь не найден' });
        return;
    }

    if (!user.contacts.includes(contact)) {
        user.contacts.push(contact);
        saveUsers(); // Сохраняем изменения
    }

    res.json({ success: true });
});

// Хранение подключений пользователей
const userSockets = {};

// Обработка подключений
io.on('connection', (socket) => {
    console.log('Новый пользователь подключен');

    // Сохраняем сокет пользователя
    socket.on('register-user', (username) => {
        userSockets[username] = socket.id;
        console.log(`Пользователь ${username} подключен с ID: ${socket.id}`);
    });

    // Отправляем личное сообщение
    socket.on('private-message', (data) => {
        const fromUser = users.find(u => u.username === data.from);
        const toUser = users.find(u => u.username === data.to);

        // Проверяем, существуют ли оба пользователя
        if (!fromUser || !toUser) {
            console.log('Один из пользователей не найден');
            return;
        }

        // Инициализируем contacts, если их нет
        if (!fromUser.contacts) {
            fromUser.contacts = [];
        }
        if (!toUser.contacts) {
            toUser.contacts = [];
        }

        // Если у получателя нет отправителя в контактах, добавляем
        if (!toUser.contacts.includes(data.from)) {
            toUser.contacts.push(data.from);
            saveUsers(); // Сохраняем изменения
            console.log(`Пользователь ${data.from} добавлен в контакты ${data.to}`);
        }

        // Если у отправителя нет получателя в контактах, добавляем
        if (!fromUser.contacts.includes(data.to)) {
            fromUser.contacts.push(data.to);
            saveUsers(); // Сохраняем изменения
            console.log(`Пользователь ${data.to} добавлен в контакты ${data.from}`);
        }

        const targetSocketId = userSockets[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('private-message', {
                from: data.from,
                message: data.message,
            });
            console.log(`Сообщение от ${data.from} доставлено ${data.to}`);
        } else {
            console.log(`Пользователь ${data.to} не подключен`);
        }

        // Сохраняем сообщение в истории
        saveMessage(data.from, data.to, data.message);
    });

    // Отслеживаем отключение
    socket.on('disconnect', () => {
        console.log('Пользователь отключен');
        // Удаляем пользователя из userSockets при отключении
        for (const [username, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[username];
                console.log(`Пользователь ${username} отключен`);
                break;
            }
        }
    });
});

// Сохранение сообщения в истории
function saveMessage(from, to, message) {
    const fromUser = users.find(u => u.username === from);
    const toUser = users.find(u => u.username === to);

    if (!fromUser || !toUser) {
        console.error('Пользователь не найден:', fromUser ? to : from);
        return;
    }

    // Инициализируем messages, если их нет
    if (!fromUser.messages) {
        fromUser.messages = {};
    }
    if (!toUser.messages) {
        toUser.messages = {};
    }

    // Сохраняем сообщение для отправителя
    if (!fromUser.messages[to]) {
        fromUser.messages[to] = [];
    }
    fromUser.messages[to].push({ from, message });

    // Сохраняем сообщение для получателя
    if (!toUser.messages[from]) {
        toUser.messages[from] = [];
    }
    toUser.messages[from].push({ from, message });

    saveUsers(); // Сохраняем изменения
}

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});