// Утилиты для управления событиями в приложении

/**
 * Отправляет уведомление об изменении данных материалов
 */
export const notifyMaterialsChange = () => {
  const event = new CustomEvent('materialsDataChanged', {
    detail: {
      timestamp: Date.now(),
      type: 'materials'
    }
  });
  window.dispatchEvent(event);
};

/**
 * Отправляет уведомление об изменении данных услуг
 */
export const notifyServicesChange = () => {
  const event = new CustomEvent('servicesDataChanged', {
    detail: {
      timestamp: Date.now(),
      type: 'services'
    }
  });
  window.dispatchEvent(event);
};

/**
 * Отправляет общее уведомление об изменении данных
 */
export const notifyDataChange = (type = 'general') => {
  const event = new CustomEvent('dataChanged', {
    detail: {
      timestamp: Date.now(),
      type
    }
  });
  window.dispatchEvent(event);
};

/**
 * Хук для прослушивания изменений данных
 * @param {Function} callback - функция обратного вызова при изменении данных
 * @param {Array} eventTypes - типы событий для прослушивания
 */
export const useDataChangeListener = (callback, eventTypes = ['materialsDataChanged']) => {
  const handleDataChange = (event) => {
    if (typeof callback === 'function') {
      callback(event);
    }
  };

  // Добавляем слушатели для всех указанных типов событий
  eventTypes.forEach(eventType => {
    window.addEventListener(eventType, handleDataChange);
  });

  // Возвращаем функцию для очистки слушателей
  return () => {
    eventTypes.forEach(eventType => {
      window.removeEventListener(eventType, handleDataChange);
    });
  };
};
