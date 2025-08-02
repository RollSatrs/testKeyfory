import { FiSettings, FiTrendingUp, FiTarget, FiPercent } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { Card, InputNumber, Switch, Divider, message, Button } from 'antd'

export function PricingGlobalSettings() {
  const [settings, setSettings] = useState({
    defaultMargin: 25,
    autoAdjustment: true,
    competitorAnalysis: false,
    dynamicPricing: false,
    minMargin: 10,
    maxMargin: 50
  })

  const [loading, setLoading] = useState(false)

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Здесь будет API вызов для сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API
      message.success('Настройки сохранены')
    } catch (error) {
      message.error('Ошибка при сохранении настроек')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 pricing-settings-card">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
          <FiSettings className="text-white text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Глобальные настройки ценообразования</h3>
          <p className="text-gray-600 text-sm">Управляйте общими параметрами ценообразования для всех услуг</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Базовые настройки */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FiPercent className="mr-2 text-blue-500" />
            Базовые параметры
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Наценка по умолчанию (%)
              </label>
              <InputNumber
                value={settings.defaultMargin}
                onChange={(value) => setSettings(prev => ({ ...prev, defaultMargin: value }))}
                min={0}
                max={100}
                className="w-full"
                size="large"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Мин. наценка (%)
                </label>
                <InputNumber
                  value={settings.minMargin}
                  onChange={(value) => setSettings(prev => ({ ...prev, minMargin: value }))}
                  min={0}
                  max={settings.maxMargin - 1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Макс. наценка (%)
                </label>
                <InputNumber
                  value={settings.maxMargin}
                  onChange={(value) => setSettings(prev => ({ ...prev, maxMargin: value }))}
                  min={settings.minMargin + 1}
                  max={200}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Автоматические настройки */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FiTrendingUp className="mr-2 text-green-500" />
            Автоматизация
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Автокорректировка цен</div>
                <div className="text-sm text-gray-500">Автоматическая корректировка на основе спроса</div>
              </div>
              <Switch
                checked={settings.autoAdjustment}
                onChange={(checked) => setSettings(prev => ({ ...prev, autoAdjustment: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Анализ конкурентов</div>
                <div className="text-sm text-gray-500">Мониторинг цен конкурентов</div>
              </div>
              <Switch
                checked={settings.competitorAnalysis}
                onChange={(checked) => setSettings(prev => ({ ...prev, competitorAnalysis: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Динамическое ценообразование</div>
                <div className="text-sm text-gray-500">Изменение цен в реальном времени</div>
              </div>
              <Switch
                checked={settings.dynamicPricing}
                onChange={(checked) => setSettings(prev => ({ ...prev, dynamicPricing: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Статистика и действия */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FiTarget className="mr-2 text-orange-500" />
            Действия
          </h4>

          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-1">Средняя наценка</div>
              <div className="text-2xl font-bold text-blue-600">{settings.defaultMargin}%</div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-900 mb-1">Активных правил</div>
              <div className="text-2xl font-bold text-green-600">3</div>
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleSaveSettings}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 border-none"
            >
              Сохранить настройки
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-settings-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </Card>
  )
}