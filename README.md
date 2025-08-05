# 🔑 Keyfory Digital Services Platform

Полнофункциональная платформа для управления цифровыми услугами с интеграцией Telegram-бота для исполнителей.

## 🏗️ Архитектура

```
keyfory-platform/
├── backend/          # Express.js API Server + PostgreSQL
├── bot/              # Telegram Bot для исполнителей
├── frontend/         # React.js Admin Panel
├── docker-compose.yml # Docker конфигурация
└── package.json      # Общие скрипты проекта
```

## 🚀 Быстрый запуск (Docker)

### Предварительные требования

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### 1. Клонирование и настройка

```bash
git clone <repository-url>
cd testKeyfory

# Создать файл окружения
cp .env.example .env
# Отредактировать .env с вашими настройками
```

### 2. Запуск всех сервисов

```bash
# Собрать и запустить все контейнеры
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down
```

### 3. Доступ к сервисам

- **Frontend (Admin Panel)**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## 🛠️ Разработка (Local)

### Установка зависимостей

```bash
# Установить все зависимости
npm run install:all

# Или по отдельности
npm run install:backend
npm run install:bot
npm run install:frontend
```

### Запуск в режиме разработки

```bash
# Запуск всех сервисов в dev режиме (в разных терминалах)
npm run dev:backend
npm run dev:bot
npm run dev:frontend
```

### Продакшн сборка

```bash
# Собрать frontend
npm run build:frontend

# Запуск в продакшн режиме
npm run start:backend
npm run start:bot
```

## 📋 Переменные окружения

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keyfory
DB_USER=keyfory_user
DB_PASSWORD=keyfory_password

# JWT
JWT_SECRET=your_jwt_secret_here

# Server
PORT=3000
NODE_ENV=development
```

### Bot (.env)

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_here

# API Connection
API_URL=http://localhost:3000
NODE_ENV=development
```

## 🗄️ База данных

### Таблицы

- **Admin** - Администраторы системы
- **Executer** - Исполнители услуг
- **Services** - Каталог услуг
- **Material** - Материалы для услуг
- **ServiceExecution** - Выполнение заказов
- **ExecuterPricing** - Индивидуальные цены
- **MaterialReplacement** - Запросы замены материалов

### Миграции

База данных автоматически синхронизируется при запуске backend сервера.

## 🤖 Telegram Bot

### Функциональность

- **🛠️ Мои услуги** - Просмотр доступных услуг с индивидуальными ценами
- **📋 Активные услуги** - Управление текущими заказами
- **✅ Выполненные услуги** - История выполненных заказов
- **📊 Статистика** - Статистика работы и заработка

### Настройка бота

1. Создать бота через @BotFather
2. Получить токен
3. Добавить токен в `.env` файл
4. Запустить bot сервис

## 🔧 API Endpoints

### Публичные

- `POST /api/admin/login` - Вход админа
- `POST /api/executers/login` - Вход исполнителя

### Админские (требуют JWT)

- `GET /api/admin/services` - Управление услугами
- `GET /api/admin/materials` - Управление материалами
- `GET /api/admin/executers` - Управление исполнителями
- `GET /api/admin/pricing` - Управление ценами

### Исполнительские

- `GET /api/executers-bot/services/:id` - Услуги с индивидуальными ценами
- `POST /api/executers-bot/use-material` - Использование материала
- `GET /api/executers-bot/active-executions/:id` - Активные заказы

## 🐳 Docker Deployment

### Production конфигурация

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  # ... секция services из docker-compose.yml ...

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
```

### Развертывание

```bash
# Для продакшн
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Обновление сервисов
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Мониторинг

### Логи

```bash
# Все логи
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f bot
```

### Состояние контейнеров

```bash
docker-compose ps
docker-compose top
```

## 🔒 Безопасность

### Рекомендации

- Изменить все пароли по умолчанию
- Использовать сильные JWT секреты
- Настроить SSL сертификаты
- Ограничить доступ к базе данных
- Регулярно обновлять зависимости

## 🚨 Устранение проблем

### Частые проблемы

1. **База данных не подключается**: Проверить переменные окружения
2. **Бот не отвечает**: Проверить токен и доступность API
3. **Frontend не загружается**: Проверить сборку и nginx конфигурацию

### Логи отладки

```bash
# Включить отладочные логи
NODE_ENV=development docker-compose up
```

## 📞 Поддержка

Для вопросов и поддержки:

- Email: support@keyfory.com
- Telegram: @keyfory_support
- Issues: GitHub Issues

---

## 🔄 Changelog

### v1.0.0 (2025-08-05)

- ✅ Полная очистка проекта от временных файлов
- ✅ Docker конфигурация для всех сервисов
- ✅ Обновленные package.json с правильными зависимостями
- ✅ Индивидуальные цены для исполнителей
- ✅ Четырехкнопочный интерфейс Telegram бота
- ✅ Полная документация для DevOps

**Статус**: ✅ Готов к продакшн развертыванию
