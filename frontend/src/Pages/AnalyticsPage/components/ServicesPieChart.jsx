import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const pieData = [
  { name: 'Игровые сервисы', value: 33, color: '#a78bfa' },
  { name: 'Стриминг', value: 24, color: '#06b6d4' },
  { name: 'ПО и утилиты', value: 21, color: '#22c55e' },
  { name: 'VPN сервисы', value: 13, color: '#f59e42' },
  { name: 'Подписки', value: 9, color: '#f43f5e' },
]

export function ServicesPieChart() {
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