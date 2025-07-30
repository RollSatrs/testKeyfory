# Отчет о локализации статусов и типов

## Что было сделано

### 1. Созданы файлы констант и локализации:

#### Backend (константы для БД):

- `backend/constants/statusConstants.js` - Английские константы для использования в базе данных

#### Frontend (локализация):

- `frontend/src/constants/localization.js` - Русские переводы и функции для отображения

#### Bot (локализация):

- `bot/constants/localization.js` - Русские переводы и сообщения для бота

### 2. Обновленные компоненты Frontend:

#### Services (Услуги):

- `frontend/src/Pages/DigitalServicesPage/components/ServicesTable.jsx`
  - Заменены hardcoded статусы на функции локализации
  - Обновлены Select опции для статусов
  - Исправлено отображение статусов материалов

#### Orders (Заказы):

- `frontend/src/Pages/OrdersPage/components/OrdersTable.jsx`
  - Обновлено отображение статусов заказов
  - Обновлено отображение статусов оплаты

#### Executors (Исполнители):

- `frontend/src/Pages/ExecutersPage/components/ExecutorsTable.jsx`
  - Обновлено отображение статусов исполнителей

#### Materials (Материалы):

- `frontend/src/Pages/KeyMaterialsPage/components/KeysMaterialsTable.jsx`
  - Обновлено отображение статусов материалов

### 3. Обновленные сервисы Backend:

#### Admin Services:

- `backend/api/service/ServiceAdmim/adminServicesService.js`
  - Заменены hardcoded статусы на константы
  - Импортированы константы статусов

#### Executer Services:

- `backend/api/service/ServiceExecuter/executerBotService.js`
  - Обновлены статусы услуг, материалов
- `backend/api/service/ServiceExecuter/executerServicesService.js`
  - Обновлены константы статусов

### 4. Обновленный Bot:

- `bot/executerBot.js`
  - Удалены старые функции локализации
  - Добавлены импорты новой системы локализации
  - Обновлены сообщения об успешном использовании материалов

## Система локализации

### Принцип работы:

1. **В базе данных** хранятся значения на английском языке (например: `'active'`, `'used'`, `'pending'`)
2. **В API запросах** передаются английские значения
3. **В интерфейсах** отображаются русские переводы через функции локализации

### Функции локализации:

#### Frontend:

```javascript
import {
  getStatusLabel,
  getStatusColor,
} from "../../../constants/localization.js";

// Получить русский перевод статуса
getStatusLabel("active", "service"); // -> 'АКТИВНА'
getStatusLabel("used", "material"); // -> 'Использован'

// Получить цвет для статуса
getStatusColor("active", "service"); // -> 'green'
getStatusColor("used", "material"); // -> 'red'
```

#### Bot:

```javascript
import {
  getBotStatusLabel,
  getBotTypeLabel,
} from "./constants/localization.js";

getBotStatusLabel("available", "material"); // -> '✅ Доступен'
getBotTypeLabel("key"); // -> '🔑 Ключ'
```

## Поддерживаемые статусы и типы

### Статусы услуг:

- `active` → `АКТИВНА`
- `inactive` → `НЕАКТИВНА`

### Статусы материалов:

- `available` → `Доступен`
- `used` → `Использован`
- `pending_replace` → `На замене`

### Статусы заказов:

- `pending` → `ОЖИДАЕТ`
- `in_progress` → `В РАБОТЕ`
- `completed` → `ЗАВЕРШЕН`
- `cancelled` → `ОТМЕНЕН`

### Статусы оплаты:

- `pending` → `ОЖИДАЕТ ОПЛАТЫ`
- `paid` → `ОПЛАЧЕН`
- `failed` → `ОШИБКА ОПЛАТЫ`
- `refunded` → `ВОЗВРАТ`

### Статусы исполнителей:

- `active` → `Активен`
- `inactive` → `Неактивен`
- `busy` → `Занят`
- `blocked` → `Заблокирован`

### Статусы запросов на замену:

- `pending` → `Ожидает`
- `approved` → `Одобрено`
- `rejected` → `Отклонено`

## Преимущества новой системы

1. **Централизованная локализация** - все переводы в одном месте
2. **Консистентность** - одинаковые переводы во всех компонентах
3. **Легкость изменений** - изменить перевод нужно только в одном файле
4. **Типобезопасность** - использование констант вместо строк
5. **Расширяемость** - легко добавить новые статусы и языки

## Что нужно делать при добавлении новых статусов

1. Добавить константу в `backend/constants/statusConstants.js`
2. Добавить перевод в `frontend/src/constants/localization.js`
3. При необходимости добавить перевод в `bot/constants/localization.js`
4. Использовать константу в backend сервисах
5. Использовать функции локализации в frontend компонентах
