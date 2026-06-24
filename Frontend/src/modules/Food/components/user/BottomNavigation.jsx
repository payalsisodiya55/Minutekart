import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Tag, ShoppingCart, Truck, ChevronRight } from "lucide-react"
import { useAuth } from "@core/context/AuthContext"
import DraggableModuleSwitcher from "../../../common/components/DraggableModuleSwitcher"

export default function BottomNavigation() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const pathname = location.pathname
  const profileSource = new URLSearchParams(location.search).get("from")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (Math.abs(currentScrollY - lastScrollY) < 5) return

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Check active routes - support both /user/* and /* paths
  const isBakery = pathname.startsWith("/food/user/bakery")
  const isUnder250 = pathname === "/food/under-250" || pathname.startsWith("/food/user/under-250")
  const isCart =
    pathname === "/food/user/cart" ||
    pathname.startsWith("/food/user/cart")
  const isDelivery =
    !isBakery &&
    !isUnder250 &&
    !isCart &&
    (pathname === "/food" ||
      pathname === "/food/" ||
      pathname === "/food/user" ||
      (pathname.startsWith("/food/user") &&
        !pathname.includes("/bakery") &&
        !pathname.includes("/under-250") &&
        !pathname.includes("/cart")))

  if (isKeyboardOpen) return null

  return (
    <>
      <DraggableModuleSwitcher />
      <div className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 ease-in-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"}`}>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 px-3 py-1.5 flex items-center justify-between gap-1">
        {/* Delivery Tab */}
        <Link
          to="/food/user"
          replace
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isDelivery
              ? "bg-[#379702]/10 text-[#379702] font-semibold"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          <Truck className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-wider uppercase">
            Delivery
          </span>
        </Link>

        {/* Under 250 Tab */}
        <Link
          to="/food/user/under-250"
          replace
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isUnder250
              ? "bg-[#379702]/10 text-[#379702] font-semibold"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          <Tag className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-wider uppercase">
            Under 250
          </span>
        </Link>

        {/* Cart Tab */}
        <Link
          to="/food/user/cart"
          replace
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isCart
              ? "bg-[#379702]/10 text-[#379702] font-semibold"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
          }`}
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[9px] font-black tracking-wider uppercase">
            Cart
          </span>
        </Link>

        {/* Instamart Link Button */}
        <Link
          to="/quick"
          className="flex items-center gap-0.5 bg-[#379702] text-white px-3.5 py-2 rounded-full font-black text-[10px] shadow-sm transition-all active:scale-95 hover:opacity-90 tracking-wide uppercase shrink-0"
        >
          <span>Instamart</span>
          <ChevronRight className="h-3 w-3" strokeWidth={4} />
        </Link>
      </div>
    </div>
    </>
  )
}
