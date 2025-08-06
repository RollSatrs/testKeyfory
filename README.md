# 🔑 Keyfory - Платформа управления цифровыми услугами

Полнофункциональная платформа для управления цифровыми услугами с административной панелью и Telegram-ботом для исполнителей.

---

## 🏗️ Архитектура системы

```
testKeyfory/
├── backend/              # API сервер (Node.js + Express + PostgreSQL)
├── bot/                  # Telegram бот для исполнителей (Telegraf.js)
├── frontend/             # Админ панель (React + Vite + Ant Design)
├── docker-compose.yml    # Конфигурация Docker
└── package.json          # Скрипты управления проектом
```

### Технологический стек:

- **Backend**: Node.js 18+, Express.js, Sequelize ORM, PostgreSQL 14+
- **Frontend**: React 18, Vite, Ant Design, Axios
- **Bot**: Node.js, Telegraf.js
- **Database**: PostgreSQL с автоматической синхронизацией схемы
- **DevOps**: Docker, Docker Compose, Nginx

---

# � ИНСТРУКЦИЯ ДЛЯ DEVOPS

## �🚀 Быстрое развертывание (Docker)

### Шаг 1: Требования системы

**Минимальные требования:**

- **RAM**: 2GB (рекомендуется 4GB)
- **CPU**: 2 ядра
- **Диск**: 10GB свободного места
- **ОС**: Linux Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

**Необходимое ПО:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git

# CentOS/RHEL
sudo yum install -y docker docker-compose git
sudo systemctl start docker
sudo systemctl enable docker

# Windows
# Установить Docker Desktop for Windows
# Включить WSL2 integration
```

### Шаг 2: Клонирование репозитория

```bash
# Клонирование проекта
git clone https://github.com/RollSatrs/testKeyfory.git
cd testKeyfory

# Проверка структуры
ls -la
# Должны видеть: backend/, bot/, frontend/, docker-compose.yml
```

### Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Создание файла окружения
cat > .env << 'EOF'
# ===========================================
# ОБЩИЕ НАСТРОЙКИ
# ===========================================
NODE_ENV=production
API_BASE_URL=http://localhost:3000

# ===========================================
# БАЗА ДАННЫХ (PostgreSQL)
# ===========================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=keyfory_db
DB_USER=keyfory_user
DB_PASSWORD=SuperSecurePassword123!

# PostgreSQL контейнер
POSTGRES_DB=keyfory_db
POSTGRES_USER=keyfory_user
POSTGRES_PASSWORD=SuperSecurePassword123!

# ===========================================
# БЕЗОПАСНОСТЬ
# ===========================================
JWT_SECRET=your_super_secret_jwt_key_256_bits_minimum!
ADMIN_JWT_SECRET=admin_super_secret_key_here_512_bits!

# ===========================================
# TELEGRAM БОТЫ
# ===========================================
# Получить токены у @BotFather
EXECUTER_BOT_TOKEN=1234567890:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ===========================================
# ПОРТЫ СЕРВИСОВ
# ===========================================
BACKEND_PORT=3000
FRONTEND_PORT=80
POSTGRES_PORT=5432
EOF
```

**⚠️ ВАЖНО: Обязательно замените следующие значения:**

- `EXECUTER_BOT_TOKEN` - получить у @BotFather в Telegram
- `JWT_SECRET` и `ADMIN_JWT_SECRET` - сгенерировать уникальные ключи
- `POSTGRES_PASSWORD` - установить сильный пароль

### Шаг 4: Запуск всей системы одной командой

```bash
# Запуск всех сервисов в фоновом режиме
docker-compose up -d

# Проверка запуска всех контейнеров
docker-compose ps

# Просмотр логов всех сервисов
docker-compose logs -f
```

### Шаг 5: Проверка работоспособности

```bash
# Проверка backend API
curl http://localhost:3000/api/health

# Проверка frontend
curl http://localhost/

# Проверка базы данных
docker-compose exec postgres psql -U keyfory_user -d keyfory_db -c "\dt"
```

**Сервисы доступны по адресам:**

- 🌐 **Frontend (Админ панель)**: http://localhost
- 🔧 **Backend API**: http://localhost:3000
- 🗄️ **PostgreSQL**: localhost:5432
- 🤖 **Telegram Bot**: автоматически работает

---

## � Расширенная конфигурация

### Настройка Nginx (продакшн)

Создайте файл `nginx.conf`:

```bash
mkdir -p ./nginx
cat > ./nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
```

### SSL сертификаты (Let's Encrypt)

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🗄️ Управление базой данных

### Резервное копирование

```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U keyfory_user keyfory_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Автоматический бэкап (добавить в cron)
echo "0 2 * * * cd /path/to/testKeyfory && docker-compose exec postgres pg_dump -U keyfory_user keyfory_db > backup_\$(date +\%Y\%m\%d_\%H\%M\%S).sql" | crontab -
```

### Восстановление

```bash
# Восстановление из бэкапа
docker-compose exec -T postgres psql -U keyfory_user keyfory_db < backup_20250805_120000.sql
```

### Миграции и сидеры

```bash
# Выполнение миграций (если добавлены новые)
docker-compose exec backend npm run migrate

# Загрузка тестовых данных (только для разработки)
docker-compose exec backend npm run seed
```

---

## � Мониторинг и логирование

### Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f bot
docker-compose logs -f frontend

# Логи с временными метками
docker-compose logs -f -t

# Последние 100 строк
docker-compose logs --tail=100 backend
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Информация о контейнерах
docker-compose top

# Размер контейнеров и образов
docker system df
```

### Настройка логирования в продакшн

```bash
# Ограничение размера логов в docker-compose.yml
# Добавить в каждый сервис:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 🔒 Безопасность

### Обязательные настройки безопасности

1. **Изменить все пароли по умолчанию**
2. **Настроить файрвол**:

   ```bash
   # Ubuntu/Debian
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable
   ```

3. **Ограничить доступ к PostgreSQL**:

   ```bash
   # В docker-compose.yml убрать ports: для postgres сервиса
   # Оставить только внутренние соединения
   ```

4. **Обновлять системы регулярно**:

   ```bash
   # Обновление образов Docker
   docker-compose pull
   docker-compose up -d

   # Обновление системы
   sudo apt update && sudo apt upgrade -y
   ```

---

## ⚡ Производительность

### Оптимизация для продакшн

1. **Увеличить лимиты памяти в docker-compose.yml**:

   ```yaml
   services:
     backend:
       mem_limit: 1g
     postgres:
       mem_limit: 2g
   ```

2. **Настроить PostgreSQL для продакшн**:

   ```bash
   # Создать файл postgres.conf
   mkdir -p ./postgres-config
   cat > ./postgres-config/postgresql.conf << 'EOF'
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   checkpoint_completion_target = 0.9
   wal_buffers = 16MB
   default_statistics_target = 100
   EOF
   ```

3. **Настроить кэширование в Nginx**:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

---

## 🚨 Устранение проблем

### Частые проблемы и решения

#### 1. **Контейнеры не запускаются**

```bash
# Проверить логи
docker-compose logs

# Пересобрать образы
docker-compose build --no-cache
docker-compose up -d
```

#### 2. **База данных не подключается**

```bash
# Проверить переменные окружения
cat .env | grep DB_

# Проверить статус PostgreSQL
docker-compose exec postgres pg_isready -U keyfory_user
```

#### 3. **Telegram бот не отвечает**

```bash
# Проверить токен
curl "https://api.telegram.org/bot$EXECUTER_BOT_TOKEN/getMe"

# Проверить логи бота
docker-compose logs bot
```

#### 4. **Frontend не загружается**

```bash
# Проверить сборку
docker-compose exec frontend ls -la /usr/share/nginx/html/

# Пересобрать frontend
docker-compose up -d --build frontend
```

### Команды диагностики

```bash
# Полная диагностика системы
echo "=== Docker статус ==="
docker-compose ps

echo "=== Использование ресурсов ==="
docker stats --no-stream

echo "=== Проверка портов ==="
netstat -tlnp | grep -E "(3000|80|5432)"

echo "=== Проверка дискового пространства ==="
df -h

echo "=== Последние логи ошибок ==="
docker-compose logs --tail=50 | grep -i error
```

---

## 🔄 Обновление системы

### Процедура обновления

```bash
# 1. Создать резервную копию
docker-compose exec postgres pg_dump -U keyfory_user keyfory_db > backup_before_update.sql

# 2. Остановить сервисы
docker-compose down

# 3. Обновить код
git pull origin main

# 4. Обновить образы
docker-compose build --no-cache

# 5. Запустить обновленные сервисы
docker-compose up -d

# 6. Проверить работоспособность
docker-compose ps
```

---

## 🎯 Первоначальная настройка администратора

### Создание первого администратора

После запуска системы выполните:

```bash
# Подключиться к backend контейнеру
docker-compose exec backend bash

# Создать администратора
node create_admin.js
# Или через базу данных напрямую:
# docker-compose exec postgres psql -U keyfory_user keyfory_db
# INSERT INTO "Admin" (username, password, email, created_at, updated_at)
# VALUES ('admin', '$2b$10$...', 'admin@keyfory.com', NOW(), NOW());
```

### Настройка Telegram ботов

1. **Создать бота через @BotFather**:

   - Отправить `/newbot` боту @BotFather
   - Указать имя бота (например, "Keyfory Executer Bot")
   - Получить токен и добавить в `.env`

2. **Настроить команды бота**:
   ```
   start - Запуск бота и авторизация
   id - Получить свой Telegram ID
   ```

---

## 📞 Поддержка и контакты

### При возникновении проблем:

1. **Проверьте логи**: `docker-compose logs -f`
2. **Проверьте статус**: `docker-compose ps`
3. **Перезапустите сервисы**: `docker-compose restart`

### Контакты для поддержки:

- **Email**: devops@keyfory.com
- **Telegram**: @keyfory_support
- **GitHub Issues**: [ссылка на репозиторий]

---

## ✅ Чек-лист развертывания

**Перед продакшн запуском убедитесь:**

- [ ] Все пароли изменены на уникальные
- [ ] SSL сертификаты настроены
- [ ] Файрвол сконфигурирован
- [ ] Резервное копирование настроено
- [ ] Мониторинг логов настроен
- [ ] Telegram боты протестированы
- [ ] Административная панель доступна
- [ ] API endpoints отвечают корректно

**Система готова к использованию! 🚀**
