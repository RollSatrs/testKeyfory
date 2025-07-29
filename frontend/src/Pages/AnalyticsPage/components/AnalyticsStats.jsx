import { useState, useEffect } from 'react'
import { FaRubleSign, FaShoppingCart, FaChartLine, FaStar } from 'react-icons/fa'

export function AnalyticsStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-red-500">Ошибка загрузки данных</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaRubleSign size={18} />
          Общая выручка
        </div>
        <div className="text-2xl font-bold">₽{stats.revenue?.total?.toLocaleString() || '0'}</div>
        <div className="text-green-500 text-sm mt-1">+{stats.revenue?.growth || 0}%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaShoppingCart size={18} />
          Средний чек
        </div>
        <div className="text-2xl font-bold">₽{stats.revenue?.average?.toLocaleString() || '0'}</div>
        <div className="text-green-500 text-sm mt-1">+8.2%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaChartLine size={18} />
          Конверсия
        </div>
        <div className="text-2xl font-bold">{stats.orders?.conversion || 0}%</div>
        <div className="text-green-500 text-sm mt-1">+2.1%</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <FaStar size={18} />
          Рейтинг сервиса
        </div>
        <div className="text-2xl font-bold">{stats.executers?.averageRating || 0}</div>
        <div className="text-green-500 text-sm mt-1">+0.3</div>
      </div>
    </div>
  )
}