import { useState, useEffect } from 'react'
import { TitleActions } from './components/TitleActions'
import { Statistics } from './components/Statistics'
import { Graphics } from './components/Graphics'
import { QuickActions } from './components/QuickActions'
import { TopPerformers } from './components/TopPerformers'
import { RecentEvents } from './components/RecentEvents'

export function Review() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const token = localStorage.getItem('admin_token')
        if (!token) {
          console.error('Токен авторизации не найден')
          return
        }

        // Получаем данные со статистики API
        const statsResponse = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!statsResponse.ok) {
          throw new Error('Ошибка загрузки статистики')
        }

        const statsData = await statsResponse.json()

        setStats({
          totalServices: statsData.services?.total || 0,
          totalExecuters: statsData.executers?.total || 0,
          totalOrders: statsData.orders?.total || 0,
          totalRevenue: statsData.revenue?.total || 0,
          newServices: statsData.services?.new || 0,
          activeExecuters: statsData.executers?.active || 0,
          completedOrdersPercent: statsData.orders?.conversion || 0,
          revenueGrowth: statsData.revenue?.growth || 0
        })
      } catch (error) {
        console.error('Ошибка загрузки данных дашборда:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <>
      {/* Блок заголовка и кнопок действий (Экспорт отчета, Создать заказ) */}
      <TitleActions/>

      {/* Карточки статистики (Цифровые услуги, Исполнители, Заказы, Выручка) */}
      <Statistics stats={stats} loading={loading} />

      {/* Графики и категории (линейный график и круговая диаграмма) */}
      <Graphics/>

      <div className="grid grid-cols-2 gap-4">
        <TopPerformers />
        {/* <RecentEvents /> */}
      </div>
    </>

  )
}