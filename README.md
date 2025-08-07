# 🔑 Keyfory - Платформа цифровых услуг

**Keyfory** - это полнофункциональная платформа для управления цифровыми услугами с интеграцией Telegram-ботов, административной панелью и системой исполнителей.

## 📋 Описание проекта

Платформа предназначена для:

- Управления цифровыми услугами (ключи, аккаунты, подписки)
- Автоматизации работы с исполнителями через Telegram-бот
- Мониторинга заказов и аналитики
- Управления материалами и складскими запасами

## 🏗️ Архитектура проекта

```
testKeyfory/
├── backend/          # API сервер (Node.js + Express + PostgreSQL)
├── frontend/         # Административная панель (React + Vite)
├── bot/             # Telegram бот для исполнителей (Telegraf)
└── docs/            # Документация (если есть)
```

## 🛠️ Технологический стек

### Backend

- **Node.js** v18+
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **Sequelize** - ORM
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей
- **cors** - CORS поддержка

### Frontend

- **React** v19
- **Vite** - сборщик
- **TailwindCSS** - стилизация
- **Ant Design** - UI компоненты
- **React Router** - маршрутизация
- **Chart.js** - графики и аналитика
- **React Icons** - иконки

### Telegram Bot

- **Telegraf** v4 - Telegram Bot Framework
- **Axios** - HTTP клиент
- **dotenv** - переменные окружения

### База данных

- **PostgreSQL** v12+
- Таблицы: admins, services, materials, orders, executers, logs, service_access

## 📦 Установка и настройка

### Предварительные требования

1. **Node.js** версии 18.0.0 или выше
2. **npm** версии 8.0.0 или выше
3. **PostgreSQL** версии 12 или выше
4. **Git** для клонирования репозитория

### 🚀 Быстрый старт

#### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd testKeyfory
```

#### 2. Установка всех зависимостей

```bash
# Установка зависимостей для всех модулей
npm run install:all

# Или по отдельности:
npm run install:backend
npm run install:frontend
npm run install:bot
```

#### 3. Настройка базы данных

1. **Создайте базу данных PostgreSQL:**

```sql
CREATE DATABASE testKeyfory;
CREATE USER postgres WITH PASSWORD '05060401';
GRANT ALL PRIVILEGES ON DATABASE testKeyfory TO postgres;
```

2. **Проверьте настройки в `.env` файле:**

```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

#### 4. Настройка Telegram ботов

1. **Создайте ботов через @BotFather:**

   - Админ бот: получите токен и добавьте в `ADMINBOT`
   - Бот исполнителей: получите токен и добавьте в `EXECUTER_BOT_TOKEN`

2. **Обновите `.env` файл:**

```env
ADMINBOT=your_admin_bot_token
EXECUTER_BOT_TOKEN=your_executer_bot_token
TELEGRAMID=your_telegram_id
```

#### 5. Запуск проекта

**Для разработки:**

```bash
# Запуск backend сервера (порт 3000)
npm run dev:backend

# Запуск frontend панели (порт 5173)
npm run dev:frontend

# Запуск Telegram бота
npm run dev:bot
```

**Для продакшена:**

```bash
# Сборка frontend
npm run build:frontend

# Запуск backend
npm run start:backend

# Запуск бота
npm run start:bot
```

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
# База данных
DB_NAME=testKeyfory
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Сервер
PORT=3000
JWT_SECRET=your_jwt_secret_key

# API
API_URL=http://localhost:3000

# Telegram боты
ADMINBOT=your_admin_bot_token
EXECUTER_BOT_TOKEN=your_executer_bot_token
TELEGRAMID=your_telegram_id
WEBAPP_EXECUTER_URL=https://your-ngrok-url.ngrok-free.app

# Токены авторизации
ADMIN_TOKEN=your_admin_token
```

### Структура базы данных

#### Основные таблицы:

1. **admins** - Администраторы системы
2. **services** - Цифровые услуги
3. **materials** - Материалы для услуг (ключи, аккаунты)
4. **orders** - Заказы клиентов
5. **executers** - Исполнители заказов
6. **logs** - Логи действий в системе
7. **service_access** - Права доступа исполнителей к услугам
8. **material_replacements** - Запросы на замену материалов

## 🎯 Функциональность

### Административная панель (Frontend)

- **Dashboard** - Общая статистика и аналитика
- **Услуги** - Управление цифровыми услугами
- **Исполнители** - Управление исполнителями и их правами
- **Заказы** - Мониторинг и управление заказами
- **Материалы** - Управление складскими запасами
- **Аналитика** - Детальная аналитика по доходам и услугам
- **Настройки** - Конфигурация системы
- **Логи** - Просмотр логов системы

### Telegram Bot для исполнителей

- **Авторизация** - Вход по Telegram ID
- **Профиль** - Просмотр и редактирование профиля
- **Активные заказы** - Работа с текущими заказами
- **История заказов** - Просмотр выполненных заказов
- **Баланс** - Просмотр заработка
- **Замена материалов** - Запрос замены неработающих материалов

### API Endpoints

#### Публичные маршруты:

- `POST /api/admin/login` - Авторизация админа
- `POST /api/admin/register` - Регистрация админа
- `POST /api/executers/login` - Авторизация исполнителя
- `POST /api/executers/register` - Регистрация исполнителя

#### Защищённые маршруты (требуют JWT токен):

**Для администраторов:**

- `GET /api/admin/services/*` - Управление услугами
- `GET /api/admin/materials/*` - Управление материалами
- `GET /api/admin/orders/*` - Управление заказами
- `GET /api/admin/executers/*` - Управление исполнителями

**Для исполнителей:**

- `GET /api/executers/orders/*` - Работа с заказами
- `GET /api/executers/materials/*` - Работа с материалами
- `GET /api/executers/profile/*` - Управление профилем

## 🐞 Отладка и решение проблем

### Распространённые ошибки:

1. **Ошибка подключения к БД:**

   ```
   ECONNREFUSED 127.0.0.1:5432
   ```

   - Проверьте, запущен ли PostgreSQL
   - Убедитесь в правильности настроек в `.env`

2. **Ошибка column does not exist:**

   ```
   column "material_name" does not exist
   ```

   - Проверьте схему БД в `backend/database/dbTables.js`
   - Выполните миграции или пересоздайте таблицы

3. **JWT токен истёк:**
   ```
   jwt expired
   ```
   - Перелогиньтесь в административной панели

### Логи и мониторинг:

- **Backend логи:** Консоль сервера (порт 3000)
- **Frontend логи:** DevTools браузера
- **Bot логи:** Консоль Telegram бота
- **База данных:** Таблица `logs` для действий пользователей

## 📱 Порты и URL

- **Backend API:** http://localhost:3000
- **Frontend Panel:** http://localhost:5173
- **PostgreSQL:** localhost:5432
- **Telegram Bot:** Работает через Telegram API

## 🤝 Участие в разработке

### Структура коммитов:

```
feat: новая функциональность
fix: исправление ошибки
docs: обновление документации
style: изменения стилей
refactor: рефакторинг кода
test: тесты
chore: прочие изменения
```

### Запуск в режиме разработки:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Bot
cd bot && npm run dev
```

## 📄 Лицензия

MIT License - см. файл `LICENSE` для деталей.

## 👥 Команда

**Keyfory Team** - Полнофункциональная платформа цифровых услуг

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки `.env` файла
4. Убедитесь, что PostgreSQL запущен
5. Проверьте доступность портов 3000 и 5173

**Для связи:** [Ваши контактные данные]

---

_Последнее обновление: Август 2025_
