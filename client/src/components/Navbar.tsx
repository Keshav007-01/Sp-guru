import { Link } from 'wouter';
import UserProfile from './UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white bg-opacity-80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <span className="text-3xl font-bold text-amber-600 drop-shadow-sm">ॐ</span>
                  <span className="ml-2 text-xl font-bold text-amber-800">Divine Mantras</span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Link href="/">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer">
                  Home
                </div>
              </Link>
              <Link href="/mantras">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <span className="text-lg text-amber-600 mr-1 leading-none">ॐ</span>
                  Mantras
                </div>
              </Link>
              <Link href="/meditation">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-1 text-blue-500"
                  >
                    <path d="M16.5 16.5c-.3 1.6-2 2.5-4.5 2.5s-4.2-.9-4.5-2.5M4 19V6a1 1 0 0 1 1-1h2.5a1 1 0 0 0 1-1V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1H19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                    <path d="M9.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1V9z" />
                    <path d="M8.5 14c.83.64 1.87 1 3 1s2.17-.36 3-1" />
                  </svg>
                  Meditation
                </div>
              </Link>
              <Link href="/blog">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-1 text-amber-600"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Spiritual Teachings
                </div>
              </Link>
              <Link href="/about">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-1 text-amber-600"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  About
                </div>
              </Link>
              {currentUser && (
                <>
                  <Link href="/favorites">
                    <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-1 text-red-500"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      Favorites
                    </div>
                  </Link>
                  <Link href="/profile">
                    <div className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-1"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="sm:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-amber-800 hover:bg-amber-100 focus:outline-none"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            <UserProfile />
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="sm:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-amber-100">
              <Link href="/">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer">
                  Home
                </div>
              </Link>
              
              <Link href="/mantras">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <span className="text-xl text-amber-600 mr-2 leading-none">ॐ</span>
                  Mantras
                </div>
              </Link>
              
              {/* Meditation link is available to all users in mobile menu too */}
              <Link href="/meditation">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 mr-2 text-blue-500"
                  >
                    <path d="M16.5 16.5c-.3 1.6-2 2.5-4.5 2.5s-4.2-.9-4.5-2.5M4 19V6a1 1 0 0 1 1-1h2.5a1 1 0 0 0 1-1V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1H19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                    <path d="M9.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1V9z" />
                    <path d="M8.5 14c.83.64 1.87 1 3 1s2.17-.36 3-1" />
                  </svg>
                  Meditation
                </div>
              </Link>
              
              <Link href="/blog">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 mr-2 text-amber-600"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Spiritual Teachings
                </div>
              </Link>
              
              <Link href="/about">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 mr-2 text-amber-600"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  About
                </div>
              </Link>
              
              {currentUser && (
                <>
                  <Link href="/favorites">
                    <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 mr-2 text-red-500"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      Favorites
                    </div>
                  </Link>
                  
                  <Link href="/profile">
                    <div className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-100 cursor-pointer flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 mr-2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}