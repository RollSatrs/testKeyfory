import express from 'express'
import {
    addServiices,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    getServiceStats,
    assignExecutersToService,
    removeExecuterFromService,
    getServiceExecuters
} from '../../service/ServiceAdmim/adminServicesService.js';
import dotenv from 'dotenv';

export const sercesRoute = express.Router()

dotenv.config();

// GET /services/get - получить все услуги
sercesRoute.get('/get', async (req, res) => {
    try {
        const services = await getAllServices();
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /services/stats - получить статистику услуг
sercesRoute.get('/stats', async (req, res) => {
    try {
        const stats = await getServiceStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching service stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /services/get/:id - получить услугу по ID
sercesRoute.get('/get/:id', async (req, res) => {
    try {
        const service = await getServiceById(req.params.id);
        res.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(404).json({ error: error.message });
    }
});

// POST /services/add - создать новую услугу
sercesRoute.post('/add', async (req, res) => {
    try {
        const newService = await addServiices(req.body);
        res.status(201).json(newService);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /services/update/:id - обновить услугу
sercesRoute.put('/update/:id', async (req, res) => {
    try {
        const updated = await updateService(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /services/delete/:id - удалить услугу
sercesRoute.delete('/delete/:id', async (req, res) => {
    try {
        const result = await deleteService(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /services/:id/executers - назначить исполнителей на услугу
sercesRoute.post('/:id/executers', async (req, res) => {
    try {
        const { executerIds } = req.body;
        const result = await assignExecutersToService(req.params.id, executerIds);
        res.json(result);
    } catch (error) {
        console.error('Error assigning executers to service:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /services/:id/executers - получить исполнителей услуги
sercesRoute.get('/:id/executers', async (req, res) => {
    try {
        const executers = await getServiceExecuters(req.params.id);
        res.json(executers);
    } catch (error) {
        console.error('Error fetching service executers:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /services/:id/executers/:executerId - убрать исполнителя с услуги
sercesRoute.delete('/:id/executers/:executerId', async (req, res) => {
    try {
        const result = await removeExecuterFromService(req.params.id, req.params.executerId);
        res.json(result);
    } catch (error) {
        console.error('Error removing executer from service:', error);
        res.status(400).json({ error: error.message });
    }
});