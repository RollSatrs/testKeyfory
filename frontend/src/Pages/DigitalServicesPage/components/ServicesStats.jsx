import { MdPeople } from 'react-icons/md'

export function ServicesStats() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdPeople size={20} />
          Всего исполнителей
        </div>
        <div className="text-2xl font-bold">12</div>
        <div className="text-green-500 text-sm mt-1">Активных: 10</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdPeople size={20} />
          Заказов выполнено
        </div>
        <div className="text-2xl font-bold">457</div>
        <div className="text-blue-500 text-sm mt-1">За месяц</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdPeople size={20} />
          Средний рейтинг
        </div>
        <div className="text-2xl font-bold">4.7</div>
        <div className="text-green-500 text-sm mt-1">Отлично</div>
      </div>
    </div>
  )
}