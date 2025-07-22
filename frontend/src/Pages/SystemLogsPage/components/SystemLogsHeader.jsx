export function SystemLogsHeader() {
  return (
    <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Системные логи</h1>
        <div className="text-gray-500 text-sm mt-1">Журнал всех действий в системе KEYFORY</div>
      </div>
      <div className="flex gap-2">
        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
          Очистить логи
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition">
          Экспорт CSV
        </button>
      </div>
    </div>
  )
}