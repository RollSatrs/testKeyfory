export function SettingsSecurity() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-4">Доступ и безопасность</div>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm mb-1">Таймаут сессии (минуты)</label>
          <input type="number" defaultValue={60} className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Максимум попыток входа</label>
          <input type="number" defaultValue={5} className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Требовать одобрение новых исполнителей
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" />
          Разрешить самостоятельную регистрацию
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" />
          Двухфакторная аутентификация
        </label>
      </div>
    </div>
  )
}