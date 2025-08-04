import express from 'express';
import multer from 'multer';
import {
    getAllMaterials,
    getMaterialById,
    addMaterial,
    updateMaterial,
    updateMaterialStatus,
    deleteMaterial,
    getMaterialStats,
    getMaterialsByService,
    getMaterialStatsByService,
    getAllReplacementRequests,
    getReplacementRequestsByStatus,
    processReplacementRequest,
    uploadMaterialsFromFile,
    addSingleMaterial
} from '../../service/ServiceAdmim/adminMaterialService.js';

// Настройка multer для загрузки файлов
const upload = multer({ dest: 'uploads/' });

export const materialRoute = express.Router();

// GET /materials/get - получить все материалы
materialRoute.get('/get', async (req, res) => {
    try {
        const materials = await getAllMaterials();
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /materials/stats - получить статистику материалов
materialRoute.get('/stats', async (req, res) => {
    try {
        const stats = await getMaterialStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching material stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /materials/service/:serviceId - получить материалы по услуге
materialRoute.get('/service/:serviceId', async (req, res) => {
    try {
        const materials = await getMaterialsByService(req.params.serviceId);
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials by service:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /materials/service/:serviceId/stats - получить статистику материалов по услуге
materialRoute.get('/service/:serviceId/stats', async (req, res) => {
    try {
        const stats = await getMaterialStatsByService(req.params.serviceId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching material stats by service:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /materials/get/:id - получить материал по ID
materialRoute.get('/get/:id', async (req, res) => {
    try {
        const material = await getMaterialById(req.params.id);
        res.json(material);
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(404).json({ error: error.message });
    }
});

// POST /materials/add - создать новый материал
materialRoute.post('/add', async (req, res) => {
    try {
        const newMaterial = await addMaterial(req.body);
        res.status(201).json(newMaterial);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /materials/update/:id - обновить материал
materialRoute.put('/update/:id', async (req, res) => {
    try {
        const updatedMaterial = await updateMaterial(req.params.id, req.body);
        res.json(updatedMaterial);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(400).json({ error: error.message });
    }
});

// PATCH /materials/update-status/:id - обновить только статус материала
materialRoute.patch('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedMaterial = await updateMaterialStatus(req.params.id, status);
        res.json(updatedMaterial);
    } catch (error) {
        console.error('Error updating material status:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /materials/delete/:id - удалить материал
materialRoute.delete('/delete/:id', async (req, res) => {
    try {
        const result = await deleteMaterial(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /materials/replacement-requests - получить все запросы на замену
materialRoute.get('/replacement-requests', async (req, res) => {
    try {
        const { status } = req.query;
        let requests;

        if (status) {
            requests = await getReplacementRequestsByStatus(status);
        } else {
            requests = await getAllReplacementRequests();
        }

        res.json(requests);
    } catch (error) {
        console.error('Error fetching replacement requests:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /materials/replacement-requests - создать запрос на замену
materialRoute.post('/replacement-requests', async (req, res) => {
    try {
        const { orderNumber, materialId, materialName, executerId, executerUsername, description } = req.body;

        if (!orderNumber || !materialId || !executerId || !description) {
            return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
        }

        const replacementData = {
            orderNumber,
            materialId,
            materialName,
            executerId,
            executerUsername,
            description,
            status: 'pending',
            createdAt: new Date()
        };

        // Здесь должен быть вызов сервиса для создания запроса
        // Пока что просто возвращаем успех
        res.status(201).json({
            success: true,
            message: 'Запрос на замену создан',
            data: replacementData
        });
    } catch (error) {
        console.error('Error creating replacement request:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /materials/replacement-requests/:id/process - обработать запрос на замену
materialRoute.post('/replacement-requests/:id/process', async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, adminResponse } = req.body;
        const adminId = req.user?.id; // Предполагается, что админ авторизован

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'Решение должно быть approved или rejected' });
        }

        const processedRequest = await processReplacementRequest(id, adminId, decision, adminResponse);
        res.json(processedRequest);
    } catch (error) {
        console.error('Error processing replacement request:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /materials/upload - загрузить материалы из файла
materialRoute.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { service_id } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        if (!service_id) {
            return res.status(400).json({ error: 'ID услуги обязателен' });
        }

        const result = await uploadMaterialsFromFile(file, service_id);
        res.json(result);
    } catch (error) {
        console.error('Error uploading materials:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /materials/add-single - добавить один материал вручную
materialRoute.post('/add-single', async (req, res) => {
    try {
        const { service_id, contents, type_key } = req.body;

        if (!service_id || !contents) {
            return res.status(400).json({ error: 'ID услуги и содержимое обязательны' });
        }

        const result = await addSingleMaterial(service_id, contents, type_key || 'manual');
        res.json(result);
    } catch (error) {
        console.error('Error adding material:', error);
        res.status(500).json({ error: error.message });
    }
});
