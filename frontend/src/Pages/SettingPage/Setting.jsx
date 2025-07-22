import { useState } from 'react'
import { SettingsSidebar } from './components/SettingsSidebar'
import { SettingsGeneral } from './components/SettingsGeneral'
import { SettingsTelegram } from './components/SettingsTelegram'
import { SettingsSecurity } from './components/SettingsSecurity'
import { SettingsPricing } from './components/SettingsPricing'
import { SettingsLogging } from './components/SettingsLogging'

const tabs = [
  { key: 'general', label: 'Общие' },
  { key: 'telegram', label: 'Telegram бот' },
  { key: 'security', label: 'Доступ и безопасность' },
  { key: 'pricing', label: 'Ценообразование' },
  { key: 'logging', label: 'Логирование' },
]

export function Setting() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="p-6">
      <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Настройки системы</h1>
          <div className="text-gray-500 text-sm mt-1">Конфигурация платформы KEYFORY</div>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
            Экспорт настроек
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Сохранить
          </button>
        </div>
      </div>
      <div className="flex gap-8">
        <SettingsSidebar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1">
          {activeTab === 'general' && <SettingsGeneral />}
          {activeTab === 'telegram' && <SettingsTelegram />}
          {activeTab === 'security' && <SettingsSecurity />}
          {activeTab === 'pricing' && <SettingsPricing />}
          {activeTab === 'logging' && <SettingsLogging />}
        </div>
      </div>
    </div>
  )
}