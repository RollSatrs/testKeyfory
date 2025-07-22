export function SettingsTelegram() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-4">Настройки Telegram бота</div>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm mb-1">Токен бота</label>
          <input type="password" defaultValue="*********" className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1">ID чата администратора</label>
          <input type="text" defaultValue="-1001234567890" className="border border-gray-200 rounded-lg px-4 py-2 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Уведомления о новых заказах
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Уведомления о заменах ключей
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Уведомления об активности исполнителей
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Автоматическое назначение заказов
        </label>
      </div>
    </div>
  )
}