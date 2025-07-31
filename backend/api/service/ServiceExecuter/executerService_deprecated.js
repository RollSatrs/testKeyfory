// =====================================
// ВРЕМЕННЫЙ ФАЙЛ ДЛЯ СОВМЕСТИМОСТИ
// =====================================
// Этот файл содержит старые функции, которые работают с Order
// Постепенно эти функции будут заменены на работу с ServiceExecution
// После полного перехода этот файл будет удален

export const getExecuterOrders = async (executerId, status = null) => {
  throw new Error('Функция getExecuterOrders устарела. Используйте getExecuterServiceExecutions');
};

export const getExecuterActiveOrders = async (executerId) => {
  throw new Error('Функция getExecuterActiveOrders устарела. Используйте getExecuterServiceExecutions');
};

export const getExecuterStats = async (executerId) => {
  throw new Error('Функция getExecuterStats устарела. Будет реализована для ServiceExecution');
};

export const getOrderById = async (orderId, executerId) => {
  throw new Error('Функция getOrderById устарела. Используйте getServiceExecution');
};

export const getMaterialsByOrder = async (orderId) => {
  throw new Error('Функция getMaterialsByOrder устарела. Используйте getServiceExecutionMaterials');
};

export const requestMaterialReplacement = async (orderId, executerId, reason, materialId = null) => {
  throw new Error('Функция requestMaterialReplacement будет обновлена для работы с ServiceExecution');
};

export const getAvailableMaterialsForReplacement = async (orderId, executerId) => {
  throw new Error('Функция getAvailableMaterialsForReplacement будет обновлена для работы с ServiceExecution');
};

export const createExecuterOrder = async (orderNumber, executerId) => {
  throw new Error('Функция createExecuterOrder устарела. Используйте createServiceExecution');
};
