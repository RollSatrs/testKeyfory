import express from 'express';
import {
    getAllMaterials,
    getMaterialById,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialStats,
    getMaterialsByService
} from '../service/materialService.js';

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
