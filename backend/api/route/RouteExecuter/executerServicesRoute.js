import express from 'express';
import { authExecuterMiddleware } from '../../middleware.js';
import {
  getAvailableServices,
  getServiceDetails,
  getMyServices,
  getServicesStats
} from '../../service/ServiceExecuter/executerServicesService.js';

export const executerServicesRoute = express.Router();

// Получить все доступные услуги
executerServicesRoute.get('/available', authExecuterMiddleware, async (req, res) => {
  try {
    const services = await getAvailableServices();

    res.json({
      success: true,
      services: services
    });
  } catch (error) {
    console.error('Ошибка получения доступных услуг:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить детали конкретной услуги
executerServicesRoute.get('/:serviceId', authExecuterMiddleware, async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const service = await getServiceDetails(serviceId);

    res.json({
      success: true,
      service: service
    });
  } catch (error) {
    console.error('Ошибка получения деталей услуги:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Получить услуги, с которыми работает исполнитель
executerServicesRoute.get('/my/list', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const services = await getMyServices(executerId);

    res.json({
      success: true,
      services: services
    });
  } catch (error) {
    console.error('Ошибка получения услуг исполнителя:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить статистику услуг для исполнителя
executerServicesRoute.get('/my/stats', authExecuterMiddleware, async (req, res) => {
  try {
    const executerId = req.user.executerId;
    const stats = await getServicesStats(executerId);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Ошибка получения статистики услуг:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
