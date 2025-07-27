import { TitleActions } from './components/TitleActions'
import { Statistics } from './components/Statistics'
import { Graphics } from './components/Graphics'
import { QuickActions } from './components/QuickActions'
import { TopPerformers } from './components/TopPerformers'
import { RecentEvents } from './components/RecentEvents'

export function Review() {
  return (
    <>
      {/* Блок заголовка и кнопок действий (Экспорт отчета, Создать заказ) */}
      <TitleActions/>


      {/* Карточки статистики (Цифровые услуги, Исполнители, Заказы, Выручка) */}
      <Statistics/>

      {/* Графики и категории (линейный график и круговая диаграмма) */}
      <Graphics/>

      <div className="grid grid-cols-2 gap-4">
        <TopPerformers />
        {/* <RecentEvents /> */}
      </div>
    </>

  )
}