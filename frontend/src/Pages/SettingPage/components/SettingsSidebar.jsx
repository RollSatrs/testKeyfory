import { FaCog, FaRobot, FaShieldAlt, FaDollarSign, FaDatabase } from 'react-icons/fa'

const icons = {
  general: <FaCog />,
  telegram: <FaRobot />,
  security: <FaShieldAlt />,
  pricing: <FaDollarSign />,
  logging: <FaDatabase />,
}

export function SettingsSidebar({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 min-w-[220px]">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left font-medium transition
            ${activeTab === tab.key ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => setActiveTab(tab.key)}
        >
          {icons[tab.key]}
          {tab.label}
        </button>
      ))}
    </div>
  )
}