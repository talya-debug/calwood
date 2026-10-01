/**
 * מצב בדיקה — כניסה בלי מסך התחברות, דרך הלינק ?demo=1
 * מיועד לסוכן AI שבודק את המערכת. נכנס לחשבון בדיקה נפרד (לא נוגע במשתמשים אמיתיים).
 * לכיבוי: לשנות DEMO_ENABLED ל-false ולפרוס מחדש.
 */

const DEMO_ENABLED = true
const DEMO_USER_ID = 'demo-ai-tester'
const KEY = 'calwood_demo'

export function isDemoMode() {
  if (!DEMO_ENABLED) return false
  try {
    // הדגל נשמר לכל הביקור, כדי שמעבר בין דפים לא יאבד אותו
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      sessionStorage.setItem(KEY, '1')
    }
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export { DEMO_USER_ID }
