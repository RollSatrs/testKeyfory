export function SettingsGeneral() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-4">Общие настройки платформы</div>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm mb-1">Название платформы</label>
          <input type="text" defaultValue="KEYFORY" className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email администратора</label>
          <input type="email" defaultValue="admin@keyfory.com" className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">Часовой пояс</label>
          <select className="border border-gray-200 rounded-lg px-4 py-2 w-full">
            <option>Москва (UTC+3)</option>
            <option>Калининград (UTC+2)</option>
            <option>Новосибирск (UTC+7)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Язык интерфейса</label>
          <select className="border border-gray-200 rounded-lg px-4 py-2 w-full">
            <option>Русский</option>
            <option>English</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Включить уведомления по email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Автоматическое резервное копирование
        </label>
      </div>
    </div>
  )
}