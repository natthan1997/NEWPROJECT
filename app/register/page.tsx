'use client';
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from "@/lib/I18nContext";

export default function RegisterMerchant() {
    const { locale } = useI18n();
  const [name, setName] = useState('')
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shopName, email, password, locale })
      })
      const result = await res.json()
      
      if (!res.ok) {
        setError(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      } else {
        setSuccess('สมัครสมาชิกและสร้างร้านค้าสำเร็จ! ระบบกำลังพาท่านไปหน้าเข้าสู่ระบบ...')
        setName('')
        setShopName('')
        setEmail('')
        setPassword('')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสมัครใช้งาน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {locale === 'en' ? 'Register New Merchant' : locale === 'zh' ? '注册新商户' : 'ลงทะเบียนร้านค้าใหม่'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {locale === 'en' ? 'For partners and store owners.' : locale === 'zh' ? '适用于合作伙伴和店主。' : 'สำหรับพาร์ทเนอร์และผู้ประกอบการร้านค้า'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <svg className="h-4 w-4 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <svg className="h-4 w-4 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'First and last name' : locale === 'zh' ? '名字和姓氏' : 'ชื่อ-นามสกุล'}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={locale === 'en' ? 'First and last name' : locale === 'zh' ? '名字和姓氏' : 'ชื่อ-นามสกุล'}
              />
            </div>
            
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Shop / Brand Name' : locale === 'zh' ? '店铺/品牌名称' : 'ชื่อร้านค้า / แบรนด์'}</label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={locale === 'en' ? 'Shop Name (e.g. My Cafe)' : locale === 'zh' ? '店铺名称' : 'ชื่อร้านค้า / แบรนด์'}
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Email' : locale === 'zh' ? '电子邮件' : 'อีเมล'}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={locale === 'en' ? 'Email' : locale === 'zh' ? '电子邮件' : 'อีเมล'}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Password' : locale === 'zh' ? '密码' : 'รหัสผ่าน'}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={locale === 'en' ? 'Password (at least 6 characters)' : locale === 'zh' ? '密码（至少6个字符）' : 'รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)'}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'en' ? 'Registering...' : locale === 'zh' ? '正在注册...' : 'กำลังลงทะเบียนร้านค้า...'}
                </>
              ) : (
                locale === 'en' ? 'Register Shop' : locale === 'zh' ? '注册商户' : 'ลงทะเบียนเปิดร้านค้า'
              )}
            </button>
          </div>
          
          <div className="text-center space-y-2">
            <Link href="/login" className="text-green-600 hover:text-green-500 text-sm">
              {locale === 'en' ? 'Already have an account? Login' : locale === 'zh' ? '已经有帐户？登录' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
            </Link>
            <br />
            <Link href="/register" className="text-blue-600 hover:text-blue-500 text-sm">
              {locale === 'en' ? 'Create a general customer account' : locale === 'zh' ? '创建一般客户帐户' : 'สร้างบัญชีลูกค้าทั่วไป'}
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
