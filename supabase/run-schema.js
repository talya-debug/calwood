import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function run() {
  await client.connect()
  console.log('מחובר ל-Neon!')

  // הרצת סכמה
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await client.query(schema)
  console.log('סכמה נוצרה בהצלחה!')

  // הרצת seed
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')
  await client.query(seed)
  console.log('נתוני ברירת מחדל נוספו!')

  // בדיקה
  const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`)
  console.log('\nטבלאות שנוצרו:')
  tables.rows.forEach(r => console.log(`  ✓ ${r.tablename}`))

  const matCount = await client.query('SELECT count(*) FROM materials')
  const ruleCount = await client.query('SELECT count(*) FROM calc_rules')
  const workCount = await client.query('SELECT count(*) FROM work_types')
  console.log(`\nנתוני ברירת מחדל:`)
  console.log(`  ✓ ${matCount.rows[0].count} חומרים`)
  console.log(`  ✓ ${ruleCount.rows[0].count} כללי חישוב`)
  console.log(`  ✓ ${workCount.rows[0].count} סוגי עבודה`)

  await client.end()
}

run().catch(e => { console.error('שגיאה:', e.message); process.exit(1) })
