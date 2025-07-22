export function SettingsLogging() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-4">Настройки логирования</div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-blue-500" />
          Вести журнал действий пользователей
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" />
          Вести журнал ошибок системы
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" />
          Вести журнал изменений настроек
        </label>
      </div>
    </div>
  )
}