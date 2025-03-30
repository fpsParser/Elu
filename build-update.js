const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Путь к папке public
const publicDir = path.join(__dirname, 'public');

// Путь для сохранения архива
const output = fs.createWriteStream(path.join(__dirname, 'public-update.zip'));

// Создаем архив
const archive = archiver('zip', {
  zlib: { level: 9 } // Максимальное сжатие
});

// Обработка ошибок
output.on('close', () => {
  console.log(`Архив создан. Размер: ${archive.pointer()} байт`);
});

archive.on('error', (err) => {
  throw err;
});

// Записываем архив
archive.pipe(output);

// Добавляем папку public в архив
archive.directory(publicDir, false);

// Завершаем создание архива
archive.finalize();