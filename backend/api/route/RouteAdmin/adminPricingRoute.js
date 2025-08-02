import express from 'express';
import adminPricingService from '../../service/ServiceAdmim/adminPricingService.js';

const router = express.Router();

// Получить все индивидуальные цены
router.get('/all', async (req, res) => {
    try {
        const pricing = await adminPricingService.getAllPricing();
        res.json(pricing);
    } catch (error) {
        console.error('Ошибка получения ценообразования:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить индивидуальную цену
router.post('/add', async (req, res) => {
    try {
        const { executer_id, service_id, custom_price } = req.body;

        if (!executer_id || !service_id || !custom_price) {
            return res.status(400).json({ error: 'Необходимо указать исполнителя, услугу и цену' });
        }

        const pricing = await adminPricingService.addCustomPricing(executer_id, service_id, custom_price);
        res.json(pricing);
    } catch (error) {
        console.error('Ошибка добавления ценообразования:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить индивидуальную цену
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { custom_price } = req.body;

        const pricing = await adminPricingService.updateCustomPricing(id, custom_price);
        res.json(pricing);
    } catch (error) {
        console.error('Ошибка обновления ценообразования:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить индивидуальную цену
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await adminPricingService.deleteCustomPricing(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления ценообразования:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить индивидуальную цену для исполнителя и услуги
router.get('/get/:executer_id/:service_id', async (req, res) => {
    try {
        const { executer_id, service_id } = req.params;
        const price = await adminPricingService.getPriceForExecuter(executer_id, service_id);
        res.json({ custom_price: price });
    } catch (error) {
        console.error('Ошибка получения цены исполнителя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

export default router;
