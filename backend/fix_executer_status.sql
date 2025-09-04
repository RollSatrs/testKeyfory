-- Исправляем статус исполнителей - устанавливаем 'active' для всех, у кого статус NULL или undefined
UPDATE executers
SET status = 'active'
WHERE status IS NULL OR status = '' OR status = 'undefined';

-- Проверяем результат
SELECT id, name, telegram_id, status, is_bot_active
FROM executers
WHERE telegram_id = '1165655712';
