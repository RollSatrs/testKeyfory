import express from 'express';
import {
    getAllMaterials,
    getMaterialById,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialStats,
    getMaterialsByService,
    getAllReplacementRequests,
    getReplacementRequestsByStatus,
    processReplacementRequest
} from '../../service/ServiceAdmim/adminMaterialService.js';

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
