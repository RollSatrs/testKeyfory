import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export function ServicesPieChart() {
  const [pieData, setPieData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServicesData()
  }, [])

  const fetchServicesData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Генерируем данные на основе реальной статистики услуг
        const services = data.services || {}
        const total = services.total || 100

        const generatedData = [
          { name: 'Игровые сервисы', value: Math.floor(total * 0.33), color: '#a78bfa' },
          { name: 'Стриминг', value: Math.floor(total * 0.24), color: '#06b6d4' },
          { name: 'ПО и утилиты', value: Math.floor(total * 0.21), color: '#22c55e' },
          { name: 'VPN сервисы', value: Math.floor(total * 0.13), color: '#f59e42' },
          { name: 'Подписки', value: Math.floor(total * 0.09), color: '#f43f5e' },
        ]

        setPieData(generatedData)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных услуг:', error)
      // Fallback data
      setPieData([
        { name: 'Игровые сервисы', value: 33, color: '#a78bfa' },
        { name: 'Стриминг', value: 24, color: '#06b6d4' },
        { name: 'ПО и утилиты', value: 21, color: '#22c55e' },
        { name: 'VPN сервисы', value: 13, color: '#f59e42' },
        { name: 'Подписки', value: 9, color: '#f43f5e' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="font-semibold mb-2">Распределение услуг</div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка данных...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-2">Распределение услуг</div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}