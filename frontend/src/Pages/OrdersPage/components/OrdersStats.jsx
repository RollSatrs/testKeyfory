import { MdPeople, MdAccessTime, MdCheckCircle, MdInventory } from 'react-icons/md'

export function OrdersStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdPeople size={20} />
          Всего заказов
        </div>
        <div className="text-2xl font-bold">4</div>
        <div className="text-green-500 text-sm mt-1">Сегодня</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdAccessTime size={20} />
          В работе
        </div>
        <div className="text-2xl font-bold">1</div>
        <div className="text-yellow-500 text-sm mt-1">1 ожидают</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdCheckCircle size={20} />
          Завершено
        </div>
        <div className="text-2xl font-bold">1</div>
        <div className="text-green-500 text-sm mt-1">1 ошибок</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdInventory size={20} />
          Выручка
        </div>
        <div className="text-2xl font-bold">₽4 500</div>
        <div className="text-green-500 text-sm mt-1">За сегодня</div>
      </div>
    </div>
  )
}