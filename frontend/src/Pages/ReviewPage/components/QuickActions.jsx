import { MdKey, MdPeople } from 'react-icons/md'
import { FaBoxOpen } from 'react-icons/fa'
import { BsArrowRepeat } from 'react-icons/bs'

const actions = [
  {
    icon: <MdKey size={28} />,
    title: 'Добавить услугу',
    desc: 'Новая цифровая услуга или подписка',
  },
  {
    icon: <MdPeople size={28} />,
    title: 'Пригласить исполнителя',
    desc: 'Добавить нового исполнителя в команду',
  },
  {
    icon: <FaBoxOpen size={28} />,
    title: 'Загрузить ключи',
    desc: 'Пополнить склад ключей и лицензий',
  },
  {
    icon: <BsArrowRepeat size={28} />,
    title: 'Проверить замены',
    desc: 'Обработать запросы на замену',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {actions.map((action, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow flex flex-col items-start p-5">
          <div className="bg-blue-600 text-white rounded-lg p-2 mb-3">{action.icon}</div>
          <div className="font-semibold mb-1">{action.title}</div>
          <div className="text-gray-500 text-sm">{action.desc}</div>
        </div>
      ))}
    </div>
  )
}