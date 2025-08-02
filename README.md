# 🔑 KeyFory - Система управления цифровыми услугами

> **Полнофункциональная система для управления цифровыми услугами с интеграцией Telegram-бота для исполнителей**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.org/)

## 📋 Описание проекта

KeyFory - это комплексная система управления цифровыми услугами, состоящая из трех основных компонентов:

- **🌐 Админ-панель (Frontend)** - веб-интерфейс для управления услугами, исполнителями и заказами
- **⚙️ Backend API** - серверная часть с REST API и базой данных
- **🤖 Telegram Bot** - бот для исполнителей с полным функционалом управления заказами

## 🏗️ Архитектура системы

```
KeyFory/
├── 🌐 frontend/          # React + Ant Design админ-панель
├── ⚙️ backend/           # Node.js + Express API сервер
├── 🤖 bot/               # Telegram бот для исполнителей
├── 📊 database/          # PostgreSQL + Sequelize ORM
└── 📄 docs/              # Документация и отчеты
```

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** или **yarn**
- **Telegram Bot Token** (получить у [@BotFather](https://t.me/botfather))

### 1. Клонирование и установка

```bash
# Клонирование репозитория
git clone https://github.com/RollSatrs/testKeyfory.git
cd testKeyfory

# Установка зависимостей для всех компонентов
npm run install-all
```

### 2. Настройка окружения

Создайте файл `.env` в корневой директории:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keyfory_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# API настройки
API_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key
ADMIN_JWT_SECRET=your_admin_jwt_secret

# Telegram Bot
EXECUTER_BOT_TOKEN=your_telegram_bot_token

# Порты
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

### 3. Инициализация базы данных

```bash
cd backend
npm run migrate        # Создание таблиц
npm run seed          # Загрузка тестовых данных
```

### 4. Запуск всех сервисов

```bash
# Запуск backend (терминал 1)
cd backend
npm run dev

# Запуск frontend (терминал 2)
cd frontend
npm run dev

# Запуск telegram bot (терминал 3)
cd bot
npm run dev
```

## 🌐 Frontend - Админ-панель

### Технологии

- **React 19** - основной фреймворк
- **Ant Design 5** - UI компоненты
- **Vite** - сборщик проекта
- **React Router** - маршрутизация
- **Chart.js** - графики и аналитика

### Основные страницы

| Страница               | Описание                       | Доступ    |
| ---------------------- | ------------------------------ | --------- |
| 🔐 **Авторизация**     | Вход администраторов           | Публичная |
| 📊 **Дашборд**         | Главная панель с аналитикой    | Админ     |
| 👥 **Исполнители**     | Управление исполнителями       | Админ     |
| 🎯 **Услуги**          | Управление цифровыми услугами  | Админ     |
| 💰 **Ценообразование** | Настройка цен для исполнителей | Админ     |
| 🏷️ **Материалы**       | Управление ключами и картами   | Админ     |
| 📋 **Заказы**          | Просмотр и управление заказами | Админ     |
| 📈 **Аналитика**       | Отчеты и статистика            | Админ     |

### Запуск в разработке

```bash
cd frontend
npm install
npm run dev
```

Админ-панель будет доступна по адресу: `http://localhost:5173`

## ⚙️ Backend - API Сервер

### Технологии

- **Node.js + Express** - веб-сервер
- **Sequelize ORM** - работа с БД
- **PostgreSQL** - основная база данных
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей
- **CORS** - поддержка кросс-доменных запросов

### API Эндпоинты

#### 🔐 Авторизация

```
POST /api/admin/auth/login     # Вход администратора
POST /api/executers/auth       # Авторизация исполнителя
```

#### 👥 Исполнители

```
GET    /api/admin/executers           # Список всех исполнителей
POST   /api/admin/executers           # Создание исполнителя
PUT    /api/admin/executers/:id       # Обновление исполнителя
DELETE /api/admin/executers/:id       # Удаление исполнителя
GET    /api/executers/services/:id    # Услуги исполнителя
```

#### 🎯 Услуги

```
GET    /api/admin/services            # Все услуги
POST   /api/admin/services            # Создание услуги
PUT    /api/admin/services/:id        # Обновление услуги
DELETE /api/admin/services/:id        # Удаление услуги
```

#### 🏷️ Материалы

```
GET    /api/admin/materials           # Все материалы
POST   /api/admin/materials           # Добавление материала
PUT    /api/admin/materials/:id       # Обновление материала
DELETE /api/admin/materials/:id       # Удаление материала
POST   /api/admin/materials/replacement-requests  # Запросы замены
```

#### 📋 Заказы

```
GET    /api/executers/order-info/:orderNumber     # Информация о заказе
POST   /api/executers/complete-order              # Завершение заказа
POST   /api/executers/cancel-order                # Отмена заказа
POST   /api/executers/add-comment                 # Добавление комментария
```

### База данных

#### Основные таблицы

- **Executers** - исполнители
- **Services** - цифровые услуги
- **Materials** - расходные материалы (ключи, карты)
- **ServiceExecutions** - выполнение заказов
- **MaterialReplacements** - запросы на замены
- **ExecuterPricing** - индивидуальные цены

### Запуск в разработке

```bash
cd backend
npm install
npm run dev
```

API сервер будет доступен по адресу: `http://localhost:3000`

## 🤖 Telegram Bot - Интерфейс для исполнителей

### Технологии

- **Telegraf.js** - фреймворк для Telegram ботов
- **Node.js** - runtime
- **node-fetch** - HTTP запросы к API

### Функциональность бота

#### 🏠 Главное меню

- **📊 Статистика** - персональная статистика исполнителя
- **🎯 Мои услуги** - доступные услуги
- **📋 Активные заказы** - текущие заказы в работе

#### 🔄 Процесс выполнения заказа

1. **Выбор услуги** из доступных исполнителю
2. **Ввод номера заказа** (например: 259161486)
3. **Получение материалов** (ключи, карты для услуги)
4. **Действия с заказом:**
   - ✅ **Заказ выполнен** - завершение заказа
   - 🔄 **Запросить замену** - при проблемах с материалами
   - 💬 **Добавить комментарий** - заметки по заказу
   - ❌ **Отменить заказ** - с указанием причины

#### 📊 Статистика исполнителя

- Количество выполненных заказов за период
- Общая сумма заработка
- Средняя стоимость за заказ
- Количество запросов на замену материалов
- Выбор периода для анализа (день, неделя, месяц)

#### 🔐 Безопасность

- Авторизация только зарегистрированных исполнителей
- Все действия логируются в базе данных
- Синхронизация с админ-панелью в реальном времени

### Команды бота

| Команда  | Описание                              |
| -------- | ------------------------------------- |
| `/start` | Авторизация и главное меню            |
| `/id`    | Получение Telegram ID для регистрации |

### Запуск бота

```bash
cd bot
npm install
npm run dev
```

## 📊 Особенности системы

### 🎯 Индивидуальное ценообразование

- Для каждого исполнителя можно установить индивидуальные цены
- Поддержка общих цен по умолчанию
- Автоматический расчет прибыли исполнителя

### 🔄 Система замен материалов

- Исполнители могут запрашивать замену некорректных материалов
- Автоматическое или ручное одобрение администратором
- Полное логирование всех запросов

### 📈 Аналитика и отчетность

- Детальная статистика по исполнителям
- Отчеты по услугам и заказам
- Экспорт данных в CSV/Excel

### 🔒 Безопасность

- JWT токены для авторизации
- Разделение прав доступа (админ/исполнитель)
- Хеширование паролей bcrypt
- Валидация всех входящих данных

## 🛠️ Разработка

### Структура проекта

```
testKeyfory/
├── backend/
│   ├── api/
│   │   ├── route/           # API маршруты
│   │   │   ├── RouteAdmin/  # Админские маршруты
│   │   │   └── RouteExecuter/ # Маршруты исполнителей
│   │   ├── service/         # Бизнес логика
│   │   └── middleware.js    # Мидлвэры
│   ├── database/
│   │   ├── config.js        # Настройки БД
│   │   ├── dbTables.js      # Модели данных
│   │   └── seedData.js      # Тестовые данные
│   └── index.js            # Точка входа
├── frontend/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── Pages/          # Страницы приложения
│   │   └── constants/      # Константы и настройки
│   └── index.html
├── bot/
│   ├── executerBot.js      # Основной файл бота
│   └── constants/          # Константы бота
└── README.md
```

### Добавление новой функциональности

1. **Backend**: Создать маршрут в `/api/route/`
2. **Frontend**: Добавить страницу в `/src/Pages/`
3. **Bot**: Обновить обработчики в `executerBot.js`
4. **Database**: Создать миграцию в `/database/`

### Тестирование

```bash
# Тестирование API
npm run test:api

# Проверка frontend
npm run test:frontend

# Проверка бота
npm run test:bot
```

## 📝 Скрипты package.json

### Backend

```json
{
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

### Frontend

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### Bot

```json
{
  "start": "node executerBot.js",
  "dev": "nodemon executerBot.js"
}
```

## 🐛 Отладка и логирование

### Backend логи

- Все API запросы логируются в консоль
- Ошибки базы данных сохраняются в файлы
- JWT токены проверяются на каждом запросе

### Bot логи

- Действия пользователей логируются с timestamp
- Ошибки API запросов отображаются в консоли
- Состояния сессий отслеживаются в памяти

### Полезные файлы для отладки

- `check_backend.js` - проверка работы API
- `debug_api.js` - тестирование эндпоинтов
- `debug_bot_logic.js` - отладка логики бота
- `debug_database.js` - проверка подключения к БД

## 📚 Документация

- `BOT_MANUAL.md` - руководство по боту
- `DATABASE_ANALYSIS.md` - анализ структуры БД
- `LOCALIZATION_REPORT.md` - отчет по локализации

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/new-feature`)
3. Зафиксируйте изменения (`git commit -am 'Add new feature'`)
4. Запушьте в ветку (`git push origin feature/new-feature`)
5. Создайте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - смотрите файл [LICENSE](LICENSE) для деталей.

## 👥 Авторы

- **RollSatrs** - _Разработчик_ - [GitHub](https://github.com/RollSatrs)

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [Issues](https://github.com/RollSatrs/testKeyfory/issues)
2. Создайте новый Issue с подробным описанием
3. Укажите версию Node.js и операционную систему

---

⭐ **Поставьте звезду, если проект был полезен!**
