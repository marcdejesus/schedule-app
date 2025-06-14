import Head from 'next/head'
import Link from 'next/link'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found - SchedulEase</title>
        <meta name="description" content="The page you're looking for doesn't exist" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
        {/* Header */}
        <header className="px-6 py-4">
          <nav className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SchedulEase</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* 404 Content */}
        <main className="max-w-4xl mx-auto px-6 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">

            {/* Error Message */}
            <div className="card p-12 max-w-2xl mx-auto">
                <h1 className="text-9xl font-bold text-primary-600 opacity-20 select-none mb-8">
                404
                </h1>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Page Not Found
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                It looks like the page you&apos;re looking for doesn&apos;t exist. 
                Don&apos;t worry - it happens to the best of us! Let&apos;s get you back on track.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/" className="btn btn-primary text-lg px-8 py-3">
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </Link>
                
                <Link href="/dashboard" className="btn btn-secondary text-lg px-8 py-3">
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </Link>
              </div>
            </div>

            {/* Fun Message */}
            <div className="mt-8 text-gray-500">
              <p className="text-sm italic">
                &quot;The best time to schedule an appointment was yesterday. The second best time is now... on a page that exists! 📅&quot;
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
            <p>&copy; 2025 SchedulEase. Built by <a href="https://marcdejesusdev.com">Marc De Jesus</a> using Rails and Next.js.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
