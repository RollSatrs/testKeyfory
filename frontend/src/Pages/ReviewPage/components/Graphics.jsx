import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const chartData = [
  { date: '26 июн', orders: 18, revenue: 50000 },
  { date: '27 июн', orders: 21, revenue: 65000 },
  { date: '28 июн', orders: 15, revenue: 40000 },
  { date: '29 июн', orders: 28, revenue: 90000 },
  { date: '30 июн', orders: 22, revenue: 70000 },
  { date: '1 июл', orders: 25, revenue: 80000 },
  { date: '2 июл', orders: 36, revenue: 100000 },
]

const pieData = [
  { name: 'Игровые сервисы', value: 45 },
  { name: 'Стриминг платформы', value: 32 },
  { name: 'Программное ПО', value: 28 },
  { name: 'VPN сервисы', value: 18 },
  { name: 'Подписки', value: 12 },
]


const COLORS = ['#6366f1', '#06b6d4', '#34d399', '#f59e42', '#f43f5e']


export function Graphics(){
    return(
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-4xl shadow p-6">
          <h2 className="font-semibold mb-2">Заказы (последние 7 дней)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#2563eb" name="Заказы" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Выручка" strokeWidth={2} yAxisId={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-4xl shadow p-6">
          <h2 className="font-semibold mb-2">Популярные категории</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>
    )
}