
export function TitleActions(){
    return(
      <div className="flex items-center justify-between bg-white shadow rounded-4xl p-5">
        <div>
          <h1 className="text-2xl font-bold">Обзор системы KEYFORY</h1>
          <p className="text-gray-500">Общая статистика и управление цифровыми услугами</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">Экспорт отчета</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Создать заказ</button>
        </div>
      </div>
    )
}