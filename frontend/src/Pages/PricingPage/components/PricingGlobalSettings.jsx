export function PricingGlobalSettings() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 flex justify-between items-start gap-8">
      <div>
        <div className="font-semibold mb-2">Глобальные настройки ценообразования</div>
        <p className="mb-2">Наценкаа по умолчанию(%)</p>
        <input
          type="number"
          defaultValue={25}
          className="border border-gray-200 rounded-lg px-4 py-2 w-100"
          placeholder="Наценка (%)"
        />
      </div>
      <div>
        <div className="font-semibold mb-2">Автоматические настройки</div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            Автоматическая корректировка цен
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            Анализ цен конкурентов
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-500" />
            Динамическое ценообразование
          </label>
        </div>
      </div>
    </div>
  )
}