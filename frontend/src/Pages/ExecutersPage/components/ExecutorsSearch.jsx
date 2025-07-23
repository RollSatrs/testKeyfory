import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { Select, Input, Button, Rate } from 'antd';

export function ExecutorsSearch({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  ratingFilter,
  setRatingFilter
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md mb-6">
      <div className="flex gap-3 items-center">
        <Input
          allowClear
          placeholder="Поиск по имени или Telegram ID..."
          className="flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 0 }}
        />
        <Button
          type="primary"
          icon={<FiFilter size={20} />}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl shadow hover:from-blue-600 hover:to-cyan-500 transition font-semibold border-0"
          style={{
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
            border: "none"
          }}
          onClick={() => setShowFilters(f => !f)}
        >
          Фильтры
        </Button>
      </div>
      {showFilters && (
        <div className="flex flex-col gap-2 md:flex-row md:gap-6 items-center">
          <Select
            className="w-full md:w-56"
            value={statusFilter}
            onChange={value => setStatusFilter(value)}
            placeholder="Все статусы"
            options={[
              { value: '', label: 'Все статусы' },
              { value: 'active', label: 'Активен' },
              { value: 'inactive', label: 'Неактивен' },
              { value: 'blocked', label: 'Заблокирован' }
            ]}
            allowClear
          />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Рейтинг:</span>
            <Rate
              allowClear
              allowHalf
              value={ratingFilter}
              onChange={setRatingFilter}
            />
            <Button
              size="small"
              type={ratingFilter == null ? "primary" : "default"}
              onClick={() => setRatingFilter(null)}
              className="ml-2"
            >
              Все рейтинги
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}