const events = [
  {
    color: 'bg-orange-400',
    text: 'Новый заказ: Spotify Premium 6 мес',
    time: '2 мин назад',
  },
  {
    color: 'bg-green-400',
    text: 'Запрос замены ключа Netflix',
    time: '15 мин назад',
  },
  {
    color: 'bg-blue-400',
    text: 'Исполнитель @alex_keys вышел в сеть',
    time: '1 час назад',
  },
  {
    color: 'bg-gray-400',
    text: 'Добавлена услуга: Discord Nitro',
    time: '2 часа назад',
  },
]

export function RecentEvents() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-semibold mb-4">Недавние события</h2>
      <ul>
        {events.map((event, idx) => (
          <li key={idx} className="flex items-center mb-3 last:mb-0">
            <span className={`inline-block w-2 h-2 rounded-full mr-3 ${event.color}`}></span>
            <div>
              <div className="text-sm">{event.text}</div>
              <div className="text-xs text-gray-400">{event.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}