import { MdInventory, MdCheckCircle, MdError, MdLock } from 'react-icons/md'

export function KeysMaterialsStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdInventory size={20} />
          Всего материалов
        </div>
        <div className="text-2xl font-bold">5</div>
        <div className="text-green-500 text-sm mt-1">4 ключей</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdCheckCircle size={20} />
          Доступно
        </div>
        <div className="text-2xl font-bold">2</div>
        <div className="text-green-500 text-sm mt-1">Готово к использованию</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdLock size={20} />
          Использовано
        </div>
        <div className="text-2xl font-bold">1</div>
        <div className="text-blue-500 text-sm mt-1">1 зарезервировано</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <MdError size={20} />
          Проблемы
        </div>
        <div className="text-2xl font-bold">1</div>
        <div className="text-red-500 text-sm mt-1">Требует внимания</div>
      </div>
    </div>
  )
}