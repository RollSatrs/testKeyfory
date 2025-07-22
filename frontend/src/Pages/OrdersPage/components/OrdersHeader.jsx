import { FiRefreshCw, FiFilter } from 'react-icons/fi'
import { MdFileDownload } from 'react-icons/md'

export function OrdersHeader() {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between">
        <h1 className="text-2xl font-bold">Управление заказами</h1>
        <div className="flex gap-2">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 transition">
            <MdFileDownload size={18} />
            Экспорт
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition">
            <FiRefreshCw size={18} />
            Обновить
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Поиск заказов по ID, услуге или клиенту..."
          className="w-full px-4 py-2 rounded-4xl border border-gray-200 focus:outline-none focus:ring"
        />
        <select className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700">
          <option>Все статусы</option>
          <option>Выполняется</option>
          <option>Завершено</option>
          <option>Ожидает</option>
        </select>
        <button className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition">
          <FiFilter className="text-gray-500" size={20} />
          Фильтры
        </button>
      </div>
    </div>
  )
}