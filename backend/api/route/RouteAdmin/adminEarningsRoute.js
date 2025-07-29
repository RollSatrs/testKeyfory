import express from 'express';
import adminEarningsService from '../../service/ServiceAdmim/adminEarningsService.js';

const router = express.Router();

// Получить всю статистику заработка
router.get('/all', async (req, res) => {
    try {
        const { from, to, executer_id, service_id } = req.query;

        const earnings = await adminEarningsService.getAllEarnings({
            from,
            to,
            executer_id,
            service_id
        });

        res.json(earnings);
    } catch (error) {
        console.error('Ошибка получения статистики заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить заработок конкретного исполнителя
router.get('/executer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        const earnings = await adminEarningsService.getExecuterEarnings(id, { from, to });
        res.json(earnings);
    } catch (error) {
        console.error('Ошибка получения заработка исполнителя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создать запись о заработке
router.post('/add', async (req, res) => {
    try {
        const { executer_id, service_id, order_id, amount, base_price, custom_price } = req.body;

        const earning = await adminEarningsService.addEarning({
            executer_id,
            service_id,
            order_id,
            amount,
            base_price,
            custom_price
        });

        res.json(earning);
    } catch (error) {
        console.error('Ошибка добавления заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить статус выплаты
router.put('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const earning = await adminEarningsService.updateEarningStatus(id, status);
        res.json(earning);
    } catch (error) {
        console.error('Ошибка обновления статуса заработка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить сводную статистику
router.get('/summary', async (req, res) => {
    try {
        const { from, to } = req.query;

        const summary = await adminEarningsService.getEarningsSummary({ from, to });
        res.json(summary);
    } catch (error) {
        console.error('Ошибка получения сводной статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router;
