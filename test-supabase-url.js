require('dotenv').config({ path: '.env.vercel.prod' })
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('URL is valid:', url.href)
} catch (e) {
  console.log('Error parsing URL:', e.message)
}
