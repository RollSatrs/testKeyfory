export function SystemLogsFilters() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col gap-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Поиск по действию, пользователю, деталям..."
          className="w-full px-4 py-2 rounded-lg border border-gray-200"
        />
        <input
          type="text"
          placeholder="дд.мм.гггг"
          className="px-4 py-2 rounded-lg border border-gray-200 w-40"
        />
        <input
          type="text"
          placeholder="дд.мм.гггг"
          className="px-4 py-2 rounded-lg border border-gray-200 w-40"
        />
        <select className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 w-40">
          <option>Все модули</option>
          <option>orders</option>
          <option>executors</option>
          <option>materials</option>
        </select>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button className="px-4 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Все уровни (8)</button>
        <button className="px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Ошибки (1)</button>
        <button className="px-4 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Предупреждения (2)</button>
        <button className="px-4 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Успешные (2)</button>
        <button className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Информация (3)</button>
      </div>
    </div>
  )
}