import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthForm() {
  const [telegramId, setTelegramId] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1 - ввод ID, 2 - ввод нового пароля
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (resetStep === 1) {
      // Проверяем, существует ли админ с таким Telegram ID
      try {
        const res = await fetch("/api/admin/check-for-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId }),
        });

        const data = await res.json();

        if (res.ok && data.exists) {
          setSuccess("Администратор найден. Введите новый пароль");
          setResetStep(2);
        } else {
          setError(data.error || "Администратор с таким Telegram ID не найден");
        }
      } catch (err) {
        setError("Ошибка соединения с сервером");
      }
    } else {
      // Смена пароля
      try {
        const res = await fetch("/api/admin/simple-reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess("Пароль успешно изменен!");
          setTimeout(() => {
            setShowForgotPassword(false);
            setResetStep(1);
            setNewPassword("");
            setSuccess("");
          }, 2000);
        } else {
          setError(data.error || "Ошибка при смене пароля");
        }
      } catch (err) {
        setError("Ошибка соединения с сервером");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin_token", data.token);
        navigate("/overview");
      } else {
        setError(data.error || "Ошибка авторизации");
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    }
  };

  return (
    <>
      {!showForgotPassword ? (
        <form
          className="flex flex-col gap-4 animate-fade-in"
          onSubmit={handleSubmit}
        >
          <style>
            {`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px);}
                to { opacity: 1; transform: translateY(0);}
              }
              .animate-fade-in {
                animation: fade-in 0.6s cubic-bezier(.4,2,.3,1) both;
              }
            `}
          </style>
          <div className="text-center mb-6">
            <div className="font-bold text-4xl mb-2 text-[#f5f7ff]">
              Welcome Back!
            </div>
            <div className="text-[#e7e7e7]">
              Введите Telegram ID и пароль для входа.
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#6375F0]">
              Telegram ID
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white placeholder-white transition-transform duration-200 focus:scale-105"
              placeholder="Введите Telegram ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#6375F0]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white placeholder-white transition-transform duration-200 focus:scale-105"
              placeholder="Введите пароль"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#8B96A0]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-blue-500"
              />
              Запомнить меня
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-[#6D7CFD] hover:underline"
            >
              Забыли пароль?
            </button>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-gradient-to-r from-[#77C3FD] via-[#6D7CFD] to-[#B3AAFC] text-white py-2 rounded-lg font-semibold hover:scale-105 hover:opacity-90 transition-transform duration-200"
          >
            Войти
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4 animate-fade-in"
          onSubmit={handleForgotPassword}
        >
          <div className="text-center mb-6">
            <div className="font-bold text-3xl mb-2 text-[#f5f7ff]">
              {resetStep === 1
                ? "Восстановление пароля"
                : "Введите новый пароль"}
            </div>
            <div className="text-[#e7e7e7]">
              {resetStep === 1
                ? "Введите ваш Telegram ID для проверки"
                : "Введите новый пароль для вашего аккаунта"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#6375F0]">
              Telegram ID
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white placeholder-white transition-transform duration-200 focus:scale-105"
              placeholder="Введите Telegram ID"
              required
              disabled={resetStep === 2}
            />
          </div>

          {resetStep === 2 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-[#6375F0]">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white placeholder-white transition-transform duration-200 focus:scale-105"
                placeholder="Введите новый пароль"
                required
              />
            </div>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetStep(1);
                setError("");
                setSuccess("");
                setNewPassword("");
              }}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Назад
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#77C3FD] via-[#6D7CFD] to-[#B3AAFC] text-white py-2 rounded-lg font-semibold hover:scale-105 hover:opacity-90 transition-transform duration-200"
            >
              {resetStep === 1 ? "Проверить ID" : "Изменить пароль"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
