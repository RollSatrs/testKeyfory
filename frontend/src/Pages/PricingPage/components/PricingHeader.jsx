export function PricingHeader() {
  return (
    <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Управление ценообразованием</h1>
      <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition">
        + Добавить правило
      </button>
    </div>
  )
}