import { useState } from "react";
import { Input, Select, Button, message } from "antd";
import { apiFetch } from "../../../lib/api";

export function ExecutorsHeader({ onAdd, children }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    telegram_id: "",
  });

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      name: "",
      telegram_id: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/executers/add", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowModal(false);
      resetForm();
      if (onAdd) onAdd();
    } catch (err) {
      message.error("Ошибка при добавлении исполнителя");
      console.error(err);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <>
      <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Управление исполнителей</h1>
        </div>
        <Button
          type="primary"
          style={{
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
            border: "none",
          }}
          onClick={() => setShowModal(true)}
        >
          + Добавить исполнителя
        </Button>
      </div>
      {showModal && (
        <div className="h-full fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in"
            onSubmit={handleSubmit}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
              Добавить исполнителя
            </h2>
            <Input
              name="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Имя исполнителя"
              required
            />
            <Input
              name="telegram_id"
              value={form.telegram_id}
              onChange={(e) => handleChange("telegram_id", e.target.value)}
              placeholder="Telegram ID"
              required
            />
            {/* rating removed */}
            <div className="flex gap-3 justify-end mt-2">
              <Button type="default" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                  border: "none",
                }}
              >
                Сохранить
              </Button>
            </div>
          </form>
          <style>
            {`
              .animate-fade-in {
                animation: fadeIn 0.3s ease;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.97);}
                to { opacity: 1; transform: scale(1);}
              }
            `}
          </style>
        </div>
      )}
    </>
  );
}
