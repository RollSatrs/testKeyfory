import { NavLink, useNavigate } from 'react-router-dom'
import { MdDashboard, MdKey, MdPeople, MdLogout } from 'react-icons/md'
import { FaBoxOpen, FaFileAlt } from 'react-icons/fa'


const menu = [
  { path: '/overview', label: 'Обзор', icon: <MdDashboard size={20} /> },
  { path: '/services', label: 'Цифровые услуги', icon: <MdKey size={20} /> },
  { path: '/users', label: 'Исполнители', icon: <MdPeople size={20} /> },
  { path: '/materials', label: 'Расходные материалы', icon: <FaBoxOpen size={20} /> },
  { path: '/logs', label: 'Логи системы', icon: <FaFileAlt size={20} /> },
]

export function Aside(){
    const navigate = useNavigate();

    const handleLogout = () => {
        // Удаляем токен из localStorage
        localStorage.removeItem('admin_token');
        // Перенаправляем на страницу входа
        navigate('/auth');
    };

    return(
        <aside className="fixed top-0 left-0 w-64 h-screen bg-blue-800 text-white flex flex-col z-20">
            <div className="px-6 py-4 font-bold text-lg tracking-wide border-b border-blue-700">
                KEYFORY
            </div>
            <nav className="flex-1 mt-2">
                <ul>
                    {menu.map(item =>(
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                `flex items-center gap-3 px-6 py-3 rounded-lg my-1 transition-colors
                                ${isActive ? 'bg-blue-600' : 'hover:bg-blue-700'}`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Кнопка выхода */}
            <div className="border-t border-blue-700 p-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left hover:bg-red-600 transition-colors duration-200"
                >
                    <MdLogout size={20} />
                    <span>Выйти</span>
                </button>
            </div>
        </aside>
    )
}