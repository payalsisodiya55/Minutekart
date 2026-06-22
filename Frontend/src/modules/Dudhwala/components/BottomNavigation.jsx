import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, CalendarDays, Bell, User } from "lucide-react"
import { useAuth } from "@core/context/AuthContext"
import DraggableModuleSwitcher from "../../common/components/DraggableModuleSwitcher"

export default function BottomNavigation() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const pathname = location.pathname
  const redirectTo = `${location.pathname || "/dudhwala"}${location.search || ""}${location.hash || ""}`
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    let initialHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardOpen(true)
      } else {
        setIsKeyboardOpen(false)
        if (currentHeight > initialHeight) {
          initialHeight = currentHeight
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const isHome = pathname === "/dudhwala" || pathname === "/dudhwala/"
  const isMyPlans = pathname.startsWith("/dudhwala/my-plans")
  const isNotifications = pathname.startsWith("/dudhwala/notifications")
  const isProfile = pathname.startsWith("/profile")

  const activeColor = "text-sky-600 dark:text-sky-400"
  const inactiveColor = "text-gray-600 dark:text-gray-400"
  const activeBg = "bg-sky-600 dark:bg-sky-400"

  if (isKeyboardOpen) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <DraggableModuleSwitcher />

      <div className="relative bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex items-center justify-around h-auto px-2 sm:px-4">
          {/* Home */}
          <Link
            to="/dudhwala"
            className={`flex flex-1 flex-col items-center gap-1.5 px-2 py-2 transition-all duration-200 relative ${isHome ? activeColor : inactiveColor}`}
          >
            <Home className={`h-5 w-5 ${isHome ? "fill-current" : ""}`} strokeWidth={2} />
            <span className={`text-xs font-medium ${isHome ? "font-semibold" : ""}`}>Home</span>
            {isHome && <div className={`absolute top-0 left-0 right-0 h-0.5 ${activeBg} rounded-b-full`} />}
          </Link>

          {/* My Plans */}
          <Link
            to="/dudhwala/my-plans"
            className={`flex flex-1 flex-col items-center gap-1.5 px-2 py-2 transition-all duration-200 relative ${isMyPlans ? activeColor : inactiveColor}`}
          >
            <CalendarDays className={`h-5 w-5 ${isMyPlans ? "fill-current" : ""}`} strokeWidth={2} />
            <span className={`text-xs font-medium ${isMyPlans ? "font-semibold" : ""}`}>My Plans</span>
            {isMyPlans && <div className={`absolute top-0 left-0 right-0 h-0.5 ${activeBg} rounded-b-full`} />}
          </Link>

          {/* Notifications */}
          <Link
            to="/dudhwala/notifications"
            className={`flex flex-1 flex-col items-center gap-1.5 px-2 py-2 transition-all duration-200 relative ${isNotifications ? activeColor : inactiveColor}`}
          >
            <Bell className={`h-5 w-5 ${isNotifications ? "fill-current" : ""}`} strokeWidth={2} />
            <span className={`text-xs font-medium ${isNotifications ? "font-semibold" : ""}`}>Alerts</span>
            {isNotifications && <div className={`absolute top-0 left-0 right-0 h-0.5 ${activeBg} rounded-b-full`} />}
          </Link>

          {/* Profile */}
          <Link
            to={isAuthenticated ? "/profile?from=dudhwala" : "/user/auth/login"}
            state={!isAuthenticated ? { from: { pathname: "/profile" }, search: "?from=dudhwala" } : undefined}
            className={`flex flex-1 flex-col items-center gap-1.5 px-2 py-2 transition-all duration-200 relative ${isProfile ? activeColor : inactiveColor}`}
          >
            <User className={`h-5 w-5 ${isProfile ? "fill-current" : ""}`} strokeWidth={2} />
            <span className={`text-xs font-medium ${isProfile ? "font-semibold" : ""}`}>Profile</span>
            {isProfile && <div className={`absolute top-0 left-0 right-0 h-0.5 ${activeBg} rounded-b-full`} />}
          </Link>
        </div>
      </div>
    </div>
  )
}
