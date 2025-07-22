import { MdKey, MdPeople, MdShoppingCart } from 'react-icons/md'
import { FaRubleSign } from 'react-icons/fa'

export function Statistics(){
    return(
      <div className="p-4 grid grid-cols-4 gap-4 ">
        <div className="bg-white rounded-4xl shadow p-6 flex flex-col ">
          <span className="text-gray-500 text-sm">Цифровые услуги</span>
          <div className="flex items-center gap-2 mt-2">
            <MdKey className="text-blue-600" size={22} />
            <span className="text-xl font-bold">24</span>
          </div>
          <span className="text-green-500 text-xs mt-1">+4 новые услуги</span>
        </div>
        <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
          <span className="text-gray-500 text-sm">Исполнители</span>
          <div className="flex items-center gap-2 mt-2">
            <MdPeople className="text-blue-600" size={22} />
            <span className="text-xl font-bold">12</span>
          </div>
          <span className="text-green-500 text-xs mt-1">+2 активных</span>
        </div>
        <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
          <span className="text-gray-500 text-sm">Заказы (30 дней)</span>
          <div className="flex items-center gap-2 mt-2">
            <MdShoppingCart className="text-blue-600" size={22} />
            <span className="text-xl font-bold">187</span>
          </div>
          <span className="text-green-500 text-xs mt-1">89% завершено</span>
        </div>
        <div className="bg-white rounded-4xl shadow p-6 flex flex-col">
          <span className="text-gray-500 text-sm">Выручка</span>
          <div className="flex items-center gap-2 mt-2">
            <FaRubleSign className="text-blue-600" size={22} />
            <span className="text-xl font-bold">₽347,250</span>
          </div>
          <span className="text-green-500 text-xs mt-1">+22.1%</span>
        </div>
      </div>
    )
}