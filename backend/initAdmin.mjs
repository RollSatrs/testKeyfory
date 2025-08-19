import bcrypt from 'bcrypt'
import { Admin } from './database/dbTables.js'

// Create an admin user on startup using env vars if it doesn't exist
export async function initializeAdmin() {
	try {
		const telegramId = process.env.ADMIN_TELEGRAM_ID || ''
		const password = process.env.ADMIN_PASSWORD || ''

		if (!telegramId || !password) {
			console.log('ℹ️ ADMIN_* env not fully provided; skipping auto-admin initialization')
			return
		}

		const existing = await Admin.findOne({ where: { telegramId: String(telegramId) } })
		if (existing) {
			console.log(`✅ Admin already exists for telegramId=${telegramId}`)
			return
		}

		const hash = await bcrypt.hash(String(password), 10)
		await Admin.create({ telegramId: String(telegramId), password: hash, created_at: new Date() })
		console.log(`🎉 Admin created from env (telegramId=${telegramId})`)
	} catch (err) {
		console.error('❌ Failed to initialize admin:', err)
	}
}

