# 🔧 Автоматическая загрузка переменных окружения

## Описание

Проект использует автоматическую систему поиска и загрузки файла `.env`. Больше не нужно указывать абсолютные пути!

## Как это работает

1. **Автоматический поиск**: Система начинает поиск `.env` файла с текущей директории
2. **Подъем вверх**: Если файл не найден, поднимается на уровень выше
3. **До корня**: Процесс продолжается до корня файловой системы
4. **Fallback**: Если файл не найден, используется `process.cwd() + '/.env'`

## Используемые файлы

Автоматическая загрузка .env настроена в следующих файлах:

### Backend

- `backend/database/databaseOn.js`
- `backend/api/middleware.js` (стандартный dotenv.config())
- `backend/api/server.js` (стандартный dotenv.config())

### Bot

- `bot/executerBot.js`
- `bot/index.js`

### Frontend/testKeyfory (старые файлы)

- `frontend/testKeyfory/bot/index.js`
- `frontend/testKeyfory/bot/clientBot.js`
- `frontend/testKeyfory/backend/database/databaseOn.js`
- `frontend/testKeyfory/backend/api/service/telegramNotificationService.js`

## Использование в новых файлах

### Метод 1: Прямое использование

```javascript
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Автоматический поиск .env файла
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findEnvFile() {
  let currentDir = __dirname;

  while (currentDir !== path.parse(currentDir).root) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return path.join(process.cwd(), ".env");
}

dotenv.config({ path: findEnvFile() });
```

### Метод 2: Использование утилиты (рекомендуется)

```javascript
// Импортируем утилиту - она автоматически загрузит .env
import "../utils/envLoader.js";

// Или можно использовать функции напрямую
import { loadEnv, findEnvPath } from "../utils/envLoader.js";

// Загрузить .env файл
loadEnv();

// Только найти путь к .env файлу
const envPath = findEnvPath();
```

## Преимущества

✅ **Портативность**: Код работает на любом компьютере
✅ **Автоматизация**: Не нужно менять пути вручную
✅ **Надежность**: Fallback на стандартное расположение
✅ **Логирование**: Показывает какой .env файл используется

## Структура проекта

```
testKeyfory/
├── .env                 # ← Основной .env файл (будет найден автоматически)
├── utils/
│   └── envLoader.js     # ← Утилита для загрузки .env
├── backend/
├── frontend/
└── bot/
```

## Отладка

Если возникают проблемы с загрузкой переменных:

1. **Проверьте консоль** - должно выводиться сообщение о найденном .env файле
2. **Убедитесь что .env существует** в корне проекта `testKeyfory/`
3. **Проверьте права доступа** к файлу .env
4. **Используйте абсолютный путь** как fallback при необходимости

## Миграция старого кода

Если у вас есть старый код с абсолютными путями:

```javascript
// Старый способ ❌
dotenv.config({ path: "C:/Users/username/project/.env" });

// Новый способ ✅
import "../utils/envLoader.js";
```

---

_Последнее обновление: Август 2025_
