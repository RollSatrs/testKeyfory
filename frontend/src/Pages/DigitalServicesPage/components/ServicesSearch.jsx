import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { Select, Input, Button } from "antd";

const categories = [
  "Все категории",
  "Игры",
  "Программное обеспечение",
  "Образование",
  "Развлечения",
  "Услуги",
  "Другое",
  "Музыка",
  "Видео и кино",
  "Социальные сети",
  "Облако и хостинг",
  "Безопасность",
  "VPN и прокси",
  "Дизайн и графика",
  "Разработка",
  "Фриланс",
  "Путешествия и билеты",
  "Электронные книги",
  "Новости и СМИ",
  "Почта и коммуникации",
  "Финансы и банки",
  "Онлайн-магазины",
  "Здоровье и спорт",
  "Авто и транспорт",
  "Дом и быт",
  "Для бизнеса",
  "Подарочные карты",
  "Мобильные приложения",
  "Фото и видео",
  "Технологии",
  "Криптовалюты",
  "Маркетинг",
  "Общение и знакомства",
];

export function ServicesSearch({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md mb-6">
      <div className="flex gap-3 items-center">
        <Input
          allowClear
          placeholder="Поиск услуги..."
          className="flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 0 }}
        />
        <Button
          type="primary"
          icon={<FiFilter size={20} />}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl shadow hover:from-blue-600 hover:to-cyan-500 transition font-semibold border-0"
          style={{
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
            border: "none",
          }}
          onClick={() => setShowFilters((f) => !f)}
        >
          Фильтры
        </Button>
      </div>
      {showFilters && (
        <div className="flex flex-col gap-2">
          <Select
            className="w-full"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="Все статусы"
            options={[
              { value: "", label: "Все статусы" },
              { value: "active", label: "🟢 Активна" },
              { value: "inactive", label: "🟠 Неактивна" },
              { value: "completed", label: "🔵 Выполнена" },
              { value: "no_executers", label: "🔴 Нет исполнителей" },
            ]}
            allowClear
          />
          <Select
            className="w-full"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            placeholder="Все категории"
            options={[
              { value: "", label: "Все категории" },
              ...categories
                .filter((c) => c !== "Все категории")
                .map((cat) => ({
                  value: cat,
                  label: cat,
                })),
            ]}
            allowClear
          />
        </div>
      )}
    </div>
  );
}
