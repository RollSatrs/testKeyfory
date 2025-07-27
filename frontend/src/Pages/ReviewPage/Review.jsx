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

        // Получаем данные с разных эндпоинтов
        const [servicesRes, executersRes, ordersRes] = await Promise.all([
          fetch('http://localhost:3000/api/admin/services'),
          fetch('http://localhost:3000/api/admin/executers'),
          fetch('http://localhost:3000/api/admin/orders')
        ])

        const services = await servicesRes.json()
        const executers = await executersRes.json()
        const orders = await ordersRes.json()

        // Подсчитываем статистику
        const totalServices = services.length
        const totalExecuters = executers.length
        const totalOrders = orders.length

        // Активные исполнители (статус active)
        const activeExecuters = executers.filter(e => e.status === 'active').length

        // Завершенные заказы
        const completedOrders = orders.filter(o => o.status === 'completed').length
        const completedOrdersPercent = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

        // Общая выручка
        const totalRevenue = orders
          .filter(o => o.status === 'completed')
          .reduce((sum, order) => sum + (order.total_sum || 0), 0)

        // Новые услуги (добавленные за последние 30 дней)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const newServices = services.filter(s =>
          new Date(s.createdAt || s.create_date_service) > thirtyDaysAgo
        ).length

        setStats({
          totalServices,
          totalExecuters,
          totalOrders,
          totalRevenue,
          newServices,
          activeExecuters,
          completedOrdersPercent,
          revenueGrowth: 12.5 // Пока статичное значение, можно будет рассчитать позже
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