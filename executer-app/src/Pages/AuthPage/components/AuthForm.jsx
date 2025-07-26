import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Typography } from "antd";

export function AuthForm() {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем Telegram ID из Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      const tgId = window.Telegram.WebApp.initDataUnsafe.user?.id;
      if (tgId) {
        setTelegramId(tgId.toString());
      } else {
        setError("Не удалось получить Telegram ID. Откройте приложение через Telegram.");
      }
    } else {
      setError("Telegram WebApp API недоступен.");
    }
  }, []);

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch('http://localhost:3000/api/executer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('executer_token', data.token);
        navigate("/overview");
      } else {
        setError(data.error || "Ошибка авторизации");
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    }
  };

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 400, margin: "0 auto", padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(16px)" }}
    >
      <Typography.Title level={2} style={{ textAlign: "center", color: "#6375F0" }}>
        Добро пожаловать!
      </Typography.Title>
      <Typography.Text style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Вход через Telegram Mini App
      </Typography.Text>
      <Form.Item label="Ваш Telegram ID">
        <Input value={telegramId} readOnly />
      </Form.Item>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Button
        type="primary"
        htmlType="submit"
        block
        disabled={!telegramId}
        style={{ background: "linear-gradient(90deg, #77C3FD, #6D7CFD, #B3AAFC)", border: "none" }}
      >
        Войти
      </Button>
    </Form>
  );
}