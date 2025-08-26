import { FaRubleSign, FaChartLine, FaUsers } from "react-icons/fa";

export function PricingHeader() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Управление ценами и аналитика
          </h1>
          <p className="text-gray-600 text-lg">
            Настройка индивидуальных цен для исполнителей и анализ доходности
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <FaRubleSign className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Ценообразование
            </span>
          </div>

          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <FaChartLine className="text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Аналитика доходов
            </span>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
            <FaUsers className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Статистика исполнителей
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
