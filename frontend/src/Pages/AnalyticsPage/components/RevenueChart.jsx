import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Янв', value: 200000 },
  { name: 'Фев', value: 250000 },
  { name: 'Мар', value: 230000 },
  { name: 'Апр', value: 280000 },
  { name: 'Май', value: 350000 },
  { name: 'Июн', value: 400000 },
]

export function RevenueChart() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="font-semibold mb-2">Динамика выручки</div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}