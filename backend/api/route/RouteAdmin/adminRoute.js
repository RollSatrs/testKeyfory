import express from 'express'
import { MaterialReplacement, Order, Services } from '../../../database/dbTables.js'
import { addAdmin, checkAdmin, login, getAllMaterialReplacements, updateReplacementStatus, getAdminStats, processReplacementWithNewMaterial, getAvailableMaterialsForReplacementAdmin } from '../../service/ServiceAdmim/adminService.js'
import { MATERIAL_STATUS } from '../../../constants/statusConstants.js'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Admin } from '../../../database/dbTables.js'

export const adminRoute = express.Router()

dotenv.config();

// Middleware для проверки JWT токена
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

adminRoute.post('/add', async (req, res) => {
  try {
    const { telegramId, passwordHash } = req.body
    console.log(telegramId, passwordHash)
    await addAdmin(telegramId, passwordHash)
    res.status(201).json({ message: 'админ был успешно создан' })
  } catch (err) {
    if(err.message === 'Не указан telegram_id или password_hash'){
      return res.status(400).json({ error: 'Не указан telegram_id или password_hash' })
    }
    if(err.message === 'Ошибка сревера'){
      return res.status(500).json({ error: 'Ошибка сервера' })
    }

  }
})

adminRoute.post('/check', async(req, res) =>{
  try{
    const {telegramId} = req.body
    const admin = await checkAdmin(telegramId)
    if (admin) {
      return res.json({ exists: true })
    } else {
      return res.json({ exists: false })
    }
  }catch(err){
    if (err.message === 'Админ не найден') {
      return res.json({ exists: false })
    }
    if (err.message === 'Ошибка сревера') {
      return res.status(500).json({ error: 'Ошибка сервера' })
    }
    return res.status(500).json({ error: err.message })
  }
})

adminRoute.post('/login', async (req, res) =>{
  try{
  console.log('Login request body:', req.body)
  const {telegramId, password} = req.body

    if (!telegramId || !password) {
      return res.status(400).json({error: "Telegram ID и пароль обязательны"})
    }

    const admin = await login(telegramId, password)
    const token = jwt.sign({ telegramId }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log(`✅ Токен создан для админа: ${telegramId}`)
    res.json({token})
  }catch(err){
  console.error('Ошибка входа:', err);
    if(err.message === 'Нет такого админа') return res.status(400).json({error: "Нет такого админа"})
    if(err.message === 'Неверный пароль') return res.status(401).json({error: "Неверный пароль"})
    return res.status(500).json({error: "Ошибка сервера"})
  }
})

adminRoute.post('forgot-password', async (req, res) => {
    try {
        const { telegramId } = req.body;
        if (!telegramId) {
            return res.status(400).json({ error: 'Телеграм ID не указан' });
        }
        // Здесь должна быть логика для сброса пароля
        res.json({ message: 'Ссылка для сброса пароля отправлена в вашем Telegram' });
    } catch (error) {
        console.error('Ошибка при сбросе пароля:', error);
        res.status(500).json({ error: error.message });
    }
})

// Роут для проверки существования админа и разрешения смены пароля
adminRoute.post('/check-for-reset', async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID не указан' });
    }

    const admin = await checkAdmin(telegramId);

    if (admin) {
      res.json({ exists: true, message: 'Администратор найден. Можете изменить пароль.' });
    } else {
      res.status(404).json({ exists: false, error: 'Администратор с таким Telegram ID не найден' });
    }
  } catch (err) {
    console.error('Ошибка при проверке админа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для простой смены пароля (без кодов)
adminRoute.post('/simple-reset-password', async (req, res) => {
  try {
    const { telegramId, newPassword } = req.body;

    if (!telegramId || !newPassword) {
      return res.status(400).json({ error: 'Telegram ID и новый пароль обязательны' });
    }

    // Проверяем, существует ли админ
    const admin = await Admin.findOne({ where: { telegramId } });

    if (!admin) {
      return res.status(404).json({ error: 'Администратор не найден' });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await Admin.update(
      { password: hashedPassword },
      { where: { telegramId } }
    );

    console.log(`✅ Пароль изменен для администратора ${telegramId}`);
    res.json({ success: true, message: 'Пароль успешно изменен!' });
  } catch (err) {
    console.error('Ошибка при смене пароля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новый запрос на замену материала
adminRoute.post('/material-replacements', async (req, res) => {
  try {
    const { orderNumber, reason, executerId } = req.body;

    if (!orderNumber || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Необходимы orderNumber и reason'
      });
    }

    // Импортируем необходимые модели
    const { ServiceExecution, MaterialReplacement } = await import('../../../database/dbTables.js');

    // Найдем выполнение заказа по номеру заказа
    const execution = await ServiceExecution.findOne({
      where: { order_number: orderNumber }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Заказ не найден'
      });
    }

    // Создаем запрос на замену материала с правильным service_execution_id
    const replacement = await MaterialReplacement.create({
      service_execution_id: execution.id, // Используем ID выполнения услуги
      reason: reason,
      status: 'pending',
      executer_id: executerId || execution.executer_id,
      created_at: new Date()
    });

    res.json({
      success: true,
      data: replacement,
      message: 'Запрос на замену материала создан'
    });
  } catch (err) {
    console.error('Ошибка при создании запроса на замену:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Получить все заявки на замену материалов
adminRoute.get('/material-replacements', authMiddleware, async (req, res) => {
  try {
    const replacements = await getAllMaterialReplacements();
    res.json(replacements);
  } catch (err) {
    console.error('Ошибка при получении заявок на замену:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить статус заявки на замену
adminRoute.put('/material-replacements/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    const replacement = await updateReplacementStatus(id, status, admin_comment);
    res.json(replacement);
  } catch (err) {
    console.error('Ошибка при обновлении статуса заявки:', err);
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

// Обработать замену материала с выбором нового материала
adminRoute.post('/material-replacements/:id/replace', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { newMaterialId, admin_comment } = req.body;

    if (!newMaterialId) {
      return res.status(400).json({ error: 'Не указан новый материал' });
    }

    const result = await processReplacementWithNewMaterial(id, newMaterialId, admin_comment);
    res.json(result);
  } catch (err) {
    console.error('Ошибка при обработке замены материала:', err);
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

// Получить доступные материалы для замены
adminRoute.get('/material-replacements/:id/available-materials', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Импортируем необходимые модели
    const { MaterialReplacement, ServiceExecution, Material } = await import('../../../database/dbTables.js');

    // Получаем заявку с информацией об исполнении
    const replacement = await MaterialReplacement.findByPk(id, {
      include: [
        {
          model: ServiceExecution,
          as: 'ServiceExecution',
          attributes: ['service_id']
        }
      ]
    });

    if (!replacement) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    // Получаем доступные материалы для этой услуги
    const materials = await Material.findAll({
      where: {
        service_id: replacement.ServiceExecution.service_id,
        status: 'доступен'
      },
      attributes: ['id', 'contents', 'type_key'] // Убираем 'name', так как его нет в таблице
    });

    res.json(materials);
  } catch (err) {
    console.error('Ошибка при получении доступных материалов:', err);
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

// Получить статистику для админ-панели
adminRoute.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для проверки валидности токена (защищенный)
adminRoute.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({ valid: true, user: req.user });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Токен недействителен' });
  }
});

// Эндпоинт для настроек замены материалов
adminRoute.get('/replacement-settings', authMiddleware, async (req, res) => {
  try {
    const services = await Services.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'name', 'replacement_type'],
      order: [['name', 'ASC']]
    });

    res.json(services);
  } catch (err) {
    console.error('Ошибка при получении настроек замены:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для обновления типа замены материалов для услуги
adminRoute.post('/replacement-settings', authMiddleware, async (req, res) => {
  try {
    const { serviceId, replacementType } = req.body;

    if (!serviceId || !replacementType) {
      return res.status(400).json({ error: 'Необходимы serviceId и replacementType' });
    }

    if (!['manual', 'auto'].includes(replacementType)) {
      return res.status(400).json({ error: 'replacementType должен быть "manual" или "auto"' });
    }

    const [updatedRowsCount] = await Services.update(
      { replacement_type: replacementType },
      { where: { id: serviceId, is_deleted: false } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json({
      success: true,
      message: `Тип замены для услуги обновлен на "${replacementType}"`
    });
  } catch (err) {
    console.error('Ошибка при обновлении настроек замены:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для получения типа замены конкретной услуги
adminRoute.get('/service-replacement-type/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Services.findOne({
      where: {
        id: serviceId,
        is_deleted: false
      },
      attributes: ['id', 'name', 'replacement_type']
    });

    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json({
      success: true,
      data: {
        serviceId: service.id,
        serviceName: service.name,
        replacementType: service.replacement_type
      }
    });
  } catch (err) {
    console.error('Ошибка при получении типа замены услуги:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для автоматической замены материала
adminRoute.post('/auto-replace-material', async (req, res) => {
  try {
    console.log(`🔄 === API: АВТОМАТИЧЕСКАЯ ЗАМЕНА МАТЕРИАЛА ===`);
    const { orderNumber, executerId } = req.body;
    console.log(`📋 Order Number: ${orderNumber}, Executer ID: ${executerId}`);

    if (!orderNumber || !executerId) {
      return res.status(400).json({ error: 'Необходимы orderNumber и executerId' });
    }

    // Импортируем необходимые модели
    const { Material, ServiceExecution, MaterialReplacement } = await import('../../../database/dbTables.js');

    // Найдем выполнение заказа
    const execution = await ServiceExecution.findOne({
      where: { order_number: orderNumber },
      include: [{
        model: Services,
        as: 'Service',
        attributes: ['id', 'name']
      }]
    });

    if (!execution) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    console.log(`🎯 Найдено выполнение заказа: ID ${execution.id}, Service ID: ${execution.service_id}, Executer ID: ${execution.executer_id}`);

    // Найдем текущий материал для этого исполнителя и заказа
    // Ищем материал который был назначен или используется для этого заказа
    const currentMaterial = await Material.findOne({
      where: {
        service_id: execution.service_id,
        executer_id: executerId,
        status: ['assigned', MATERIAL_STATUS.USED] // Ищем и назначенные и уже использованные
      }
    });

    if (!currentMaterial) {
      return res.status(404).json({ error: 'Текущий материал исполнителя не найден' });
    }

    // Найдем новый доступный материал для замены
    const newMaterial = await Material.findOne({
      where: {
        service_id: execution.service_id,
        status: MATERIAL_STATUS.AVAILABLE
      }
    });

    if (!newMaterial) {
      return res.status(400).json({ error: 'Нет доступных материалов для замены' });
    }

    // Выполняем замену в транзакции
    const { sequelize } = await import('../../../database/databaseOn.js');

    await sequelize.transaction(async (t) => {
      // Если материал еще не использован, помечаем его как использованный
      if (currentMaterial.status !== MATERIAL_STATUS.USED) {
        await currentMaterial.update({
          status: MATERIAL_STATUS.USED,
          used_date: new Date()
        }, { transaction: t });
      }

      // Назначаем новый материал исполнителю
      await newMaterial.update({
        status: 'assigned',
        executer_id: executerId,
        reserved_at: new Date()
      }, { transaction: t });

      // Создаем запись о замене
      await MaterialReplacement.create({
        service_execution_id: execution.id, // ID выполнения услуги (service_execution)
        executer_id: execution.executer_id, // ID из таблицы executers
        material_id: currentMaterial.id, // Старый материал
        reason: 'Автоматическая замена материала',
        status: 'completed',
        admin_response: `Автоматическая замена: ${currentMaterial.contents || 'материал'} → ${newMaterial.contents || 'материал'}`,
        processed_at: new Date(),
        created_at: new Date()
      }, { transaction: t });
    });

    // Отправляем уведомление исполнителю через бот
    try {
      // Получаем данные исполнителя
      const executer = await Executer.findByPk(executerId);

      if (executer && executer.telegram_id) {
        const botModule = await import('../../../../bot/executerBot.js');

        if (botModule.notifyMaterialReplacement) {
          await botModule.notifyMaterialReplacement({
            telegramId: executer.telegram_id,
            orderNumber: orderNumber,
            serviceName: execution.Service?.name || 'Неизвестная услуга',
            oldMaterial: `${currentMaterial.type_key || 'Материал'} - ${currentMaterial.contents || 'Содержимое'}`,
            newMaterial: `${newMaterial.type_key || 'Материал'} - ${newMaterial.contents || 'Содержимое'}`,
            adminComment: 'Автоматическая замена согласно настройкам услуги'
          });

          console.log(`✅ Уведомление об автоматической замене отправлено исполнителю ${executer.telegram_id}`);
        }
      }
    } catch (notifyError) {
      console.error('❌ Ошибка отправки уведомления об автоматической замене:', notifyError);
    }

    res.json({
      success: true,
      message: 'Материал автоматически заменен',
      data: {
        oldMaterial: {
          id: currentMaterial.id,
          contents: currentMaterial.contents,
          name: currentMaterial.name
        },
        newMaterial: {
          id: newMaterial.id,
          contents: newMaterial.contents,
          name: newMaterial.name
        }
      }
    });

  } catch (err) {
    console.error('Ошибка при автоматической замене материала:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить запрос на замену
adminRoute.delete('/material-replacements/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Импортируем необходимые модели
    const { MaterialReplacement } = await import('../../../database/dbTables.js');

    // Проверяем существование запроса
    const replacement = await MaterialReplacement.findByPk(id);

    if (!replacement) {
      return res.status(404).json({ error: 'Запрос на замену не найден' });
    }

    // Удаляем запрос
    await replacement.destroy();

    res.json({
      success: true,
      message: 'Запрос на замену успешно удален'
    });

  } catch (err) {
    console.error('Ошибка при удалении запроса на замену:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});