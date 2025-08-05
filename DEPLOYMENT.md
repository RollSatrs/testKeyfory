# 🚀 KEYFORY PLATFORM - DEPLOYMENT GUIDE

## 📋 Обзор проекта

**Keyfory Platform** - это полнофункциональная система управления цифровыми услугами с интеграцией Telegram-бота для исполнителей.

### 🏗️ Компоненты системы:

- **Backend**: Node.js + Express.js + PostgreSQL + Sequelize ORM
- **Bot**: Telegram Bot на Telegraf.js для исполнителей
- **Frontend**: React.js + Ant Design админ-панель
- **Database**: PostgreSQL с индивидуальными ценами и материалами

---

## ⚡ БЫСТРОЕ РАЗВЕРТЫВАНИЕ (5 минут)

### Windows:

```cmd
git clone <repository-url>
cd testKeyfory
copy .env.example .env
REM Отредактировать .env с вашими настройками
deploy.bat
```

### Linux/macOS:

```bash
git clone <repository-url>
cd testKeyfory
cp .env.example .env
# Отредактировать .env с вашими настройками
chmod +x deploy.sh
./deploy.sh
```

---

## 🐳 DOCKER DEPLOYMENT (Рекомендуется)

### Предварительные требования:

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM (минимум)
- 10GB свободного места

### Структура Docker:

```yaml
Services:
├── postgres:15-alpine    # База данных
├── keyfory_backend      # API сервер (порт 3000)
├── keyfory_bot          # Telegram бот
└── keyfory_frontend     # Web интерфейс (порт 80)
```

### Команды развертывания:

```bash
# Полное развертывание
docker-compose up -d

# Пересборка при изменениях
docker-compose build --no-cache
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

---

## 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА

### 1. Установка зависимостей:

```bash
# Корневой уровень (все сразу)
npm run install:all

# Или по отдельности
npm run install:backend
npm run install:bot
npm run install:frontend
```

### 2. Настройка базы данных:

```sql
-- PostgreSQL setup
CREATE DATABASE keyfory;
CREATE USER keyfory_user WITH PASSWORD 'keyfory_password';
GRANT ALL PRIVILEGES ON DATABASE keyfory TO keyfory_user;
```

### 3. Запуск в dev режиме:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Bot
npm run dev:bot

# Terminal 3: Frontend
npm run dev:frontend
```

### 4. Доступ к сервисам:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432

---

## 📋 КОНФИГУРАЦИЯ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ

### Обязательные переменные:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keyfory
DB_USER=keyfory_user
DB_PASSWORD=your_secure_password

# JWT Security
JWT_SECRET=your_super_secret_jwt_key_32_chars_minimum

# Telegram Bot
BOT_TOKEN=1234567890:ABCDEF1234567890abcdef1234567890

# Server
PORT=3000
NODE_ENV=production
```

### Безопасность:

- ⚠️ **Обязательно изменить все пароли по умолчанию**
- ⚠️ **JWT_SECRET должен быть 32+ символов**
- ⚠️ **BOT_TOKEN получить от @BotFather**

---

## 🗄️ БАЗА ДАННЫХ

### Схема БД:

```sql
Tables:
├── admin (id, username, password_hash, created_at)
├── executer (id, name, telegram_id, balance, rating, status)
├── services (id, name, price, category, executer_id)
├── material (id, contents, service_id, status, order_number)
├── service_execution (id, order_number, executer_id, service_id, status)
├── executer_pricing (id, executer_id, service_id, custom_price)
└── material_replacement (id, material_id, executer_id, reason)
```

### Автоматическая миграция:

- База данных синхронизируется автоматически при запуске backend
- Использует Sequelize ORM с `sync({ alter: true })`
- Сохраняет существующие данные

---

## 🤖 TELEGRAM BOT

### Функциональность:

1. **🛠️ Мои услуги** - Показ доступных услуг с индивидуальными ценами
2. **📋 Активные услуги** - Управление текущими заказами
3. **✅ Выполненные услуги** - История выполненных работ
4. **📊 Статистика** - Заработок и рейтинг

### Особенности:

- **Индивидуальные цены**: ExecuterPricing таблица (100₽ вместо 1500₽)
- **Сессии**: Telegraf sessions для состояния пользователя
- **ES модули**: Современный синтаксис import/export
- **Обработка ошибок**: Детальное логирование

### Настройка бота:

```bash
# 1. Создать бота через @BotFather
# 2. Получить токен
# 3. Добавить в .env:
BOT_TOKEN=your_bot_token_here

# 4. Запустить бота
cd bot && npm start
```

---

## 🔌 API ENDPOINTS

### Публичные маршруты:

```http
POST /api/admin/login           # Вход админа
POST /api/executers/login       # Вход исполнителя
GET  /api/executers/register    # Регистрация исполнителя
```

### Админские маршруты (JWT):

```http
GET    /api/admin/services      # Управление услугами
POST   /api/admin/services      # Создание услуги
PUT    /api/admin/services/:id  # Обновление услуги
DELETE /api/admin/services/:id  # Удаление услуги

GET    /api/admin/materials     # Управление материалами
GET    /api/admin/executers     # Управление исполнителями
GET    /api/admin/pricing       # Индивидуальные цены
```

### Боевые маршруты (без JWT):

```http
GET  /api/executers-bot/services/:executerId           # Услуги с индивидуальными ценами
GET  /api/executers-bot/materials/:serviceId           # Материалы услуги
POST /api/executers-bot/use-material                   # Использование материала
GET  /api/executers-bot/active-executions/:executerId  # Активные заказы
GET  /api/executers-bot/stats/:executerId              # Статистика исполнителя
```

---

## 📊 МОНИТОРИНГ И ЛОГИ

### Docker Logs:

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f bot
docker-compose logs -f frontend
docker-compose logs -f postgres

# Последние 100 строк
docker-compose logs --tail=100
```

### Состояние сервисов:

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker-compose top

# Статистика контейнеров
docker stats
```

### Типичные проблемы:

1. **Backend не стартует**: Проверить DB_HOST и credentials
2. **Bot не отвечает**: Проверить BOT_TOKEN и API_URL
3. **Frontend 404**: Проверить nginx конфигурацию
4. **DB connection failed**: Проверить PostgreSQL статус

---

## 🔒 БЕЗОПАСНОСТЬ

### Production Security Checklist:

- [ ] Изменены все пароли по умолчанию
- [ ] JWT_SECRET - сильный ключ (32+ символов)
- [ ] NODE_ENV=production
- [ ] CORS настроен для production домена
- [ ] SSL сертификаты установлены
- [ ] Database пользователь с минимальными правами
- [ ] Регулярные обновления зависимостей
- [ ] Backup стратегия настроена

### Рекомендуемые настройки:

```env
# Production .env
NODE_ENV=production
JWT_SECRET=super_secure_random_string_32_characters_minimum
DB_PASSWORD=very_strong_database_password_123!
CORS_ORIGIN=https://yourdomain.com
```

---

## 🚦 PRODUCTION DEPLOYMENT

### 1. Server Requirements:

```
Minimum:
- 2 CPU cores
- 4GB RAM
- 20GB SSD
- Ubuntu 20.04+ / CentOS 8+

Recommended:
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Load balancer for scaling
```

### 2. Nginx Reverse Proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL Setup:

```bash
# Let's Encrypt
certbot --nginx -d yourdomain.com
```

### 4. Process Management:

```bash
# PM2 для production
npm install -g pm2

# Backend
cd backend && pm2 start api/server.js --name keyfory-backend

# Bot
cd bot && pm2 start index.js --name keyfory-bot

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## 🔄 ОБНОВЛЕНИЕ СИСТЕМЫ

### Rolling Update:

```bash
# 1. Backup database
docker exec keyfory_db pg_dump -U keyfory_user keyfory > backup.sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# 4. Verify health
curl http://localhost:3000/
curl http://localhost/
```

### Rollback Procedure:

```bash
# Откат к предыдущей версии
git checkout previous_commit_hash
docker-compose build --no-cache
docker-compose up -d

# Restore database if needed
docker exec -i keyfory_db psql -U keyfory_user keyfory < backup.sql
```

---

## 📞 ПОДДЕРЖКА И УСТРАНЕНИЕ ПРОБЛЕМ

### Diagnostic Commands:

```bash
# Health check
curl -f http://localhost:3000/ || echo "Backend down"
curl -f http://localhost/ || echo "Frontend down"

# Database connection
docker exec keyfory_db psql -U keyfory_user -d keyfory -c "SELECT 1;"

# Bot status
docker logs keyfory_bot --tail=20

# Disk usage
df -h
docker system df
```

### Common Issues:

**Problem**: "Cannot connect to database"

```bash
# Solution:
docker-compose restart postgres
# Wait 30 seconds
docker-compose restart backend
```

**Problem**: "Bot not responding"

```bash
# Check bot logs
docker logs keyfory_bot

# Verify token
echo $BOT_TOKEN | curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/getMe
```

**Problem**: "Frontend shows 404"

```bash
# Rebuild frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

---

## ✅ РЕЗУЛЬТАТ ОЧИСТКИ ПРОЕКТА

### 🗑️ Удалено временных файлов: **44**

- ❌ `test_*` файлы (8 файлов)
- ❌ `debug_*` файлы (4 файла)
- ❌ `temp_*` файлы (2 файла)
- ❌ `check_*` файлы (6 файлов)
- ❌ `migration_*` файлы (24 файла)

### 📁 Итоговая структура:

```
keyfory-platform/
├── backend/              # ✅ Express.js API + PostgreSQL
│   ├── api/             # ✅ Routes & Services
│   ├── database/        # ✅ Models & Config
│   └── constants/       # ✅ Status constants
├── bot/                 # ✅ Telegram Bot (Telegraf)
│   ├── constants/       # ✅ Localization
│   └── index.js         # ✅ Main bot file
├── frontend/            # ✅ React.js Admin Panel
│   └── src/            # ✅ Components & Pages
├── docker-compose.yml   # ✅ Docker orchestration
├── package.json         # ✅ Root scripts
├── .env.example         # ✅ Environment template
├── deploy.sh            # ✅ Linux deployment
├── deploy.bat           # ✅ Windows deployment
└── README.md            # ✅ Full documentation
```

### 🎯 DevOps Ready Features:

- ✅ **Docker** - Полная контейнеризация всех сервисов
- ✅ **Dependencies** - Очищенные package.json с точными версиями
- ✅ **Environment** - .env.example со всеми настройками
- ✅ **Documentation** - Подробная документация развертывания
- ✅ **Scripts** - Автоматические скрипты для Windows/Linux
- ✅ **Security** - Security checklist и рекомендации
- ✅ **Monitoring** - Логирование и health checks
- ✅ **Production** - Production-ready конфигурация

---

**🎉 СТАТУС: ГОТОВ К ПРОДАКШН РАЗВЕРТЫВАНИЮ!**
