export function ExecutorsHeader() {
  return (
    <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Исполнители</h1>
        <div className="text-gray-500 text-sm mt-1">Простая версия страницы исполнителей для тестирования</div>
      </div>
      <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
        + Добавить исполнителя
      </button>
    </div>
  )
}