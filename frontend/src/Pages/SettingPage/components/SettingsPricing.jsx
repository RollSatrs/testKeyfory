export function SettingsPricing() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-4">Настройки ценообразования</div>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm mb-1">Наценка по умолчанию (%)</label>
          <input type="number" defaultValue={15} className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Валюта</label>
          <select className="border border-gray-200 rounded-lg px-4 py-2 w-full">
            <option>Российский рубль (₽)</option>
            <option>Доллар США ($)</option>
            <option>Евро (€)</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" />
          Динамическое ценообразование
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Индивидуальные тарифы для исполнителей
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Скидки на оптовые заказы
        </label>
      </div>
    </div>
  )
}