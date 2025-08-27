import { Button } from "antd";
import { FaChartLine, FaSyncAlt } from "react-icons/fa";

export function PricingHeader({ onRefresh, children }) {
  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Ценообразование исполнителей
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Анализ заработка, статистика по исполнителям и управление
                индивидуальными ценами
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              type="primary"
              icon={<FaSyncAlt />}
              style={{
                background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                border: "none",
              }}
              onClick={onRefresh}
            >
              Обновить данные
            </Button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
