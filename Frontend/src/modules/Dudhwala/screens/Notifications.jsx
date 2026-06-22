import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Bell, CheckCircle2, Clock, Tag, Gift, AlertCircle, Trash2, X, Milk, Loader2 } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { Card, CardContent } from "@food/components/ui/card"
import { Badge } from "@food/components/ui/badge"
import useNotificationInbox from "@food/hooks/useNotificationInbox"

const ICON_MAP = {
  CheckCircle2,
  Tag,
  Gift,
  AlertCircle,
  Milk,
  Bell
}

import BottomNavigation from "../components/BottomNavigation"

export default function Notifications() {
  const [localNotifications, setLocalNotifications] = useState(() => {
    const saved = localStorage.getItem('dudhwala_user_notifications')
    return saved ? JSON.parse(saved) : []
  })

  const {
    items: broadcastNotifications,
    unreadCount: broadcastUnreadCount,
    loading,
    markAsRead: markBroadcastAsRead,
    dismiss: dismissBroadcastNotification,
    dismissAll: dismissAllBroadcastNotifications,
  } = useNotificationInbox("user", { limit: 100, pollMs: 10000 })

  // Persistence for local notifications
  useEffect(() => {
    localStorage.setItem('dudhwala_user_notifications', JSON.stringify(localNotifications))
  }, [localNotifications])

  // Listen for real-time order/delivery updates
  useEffect(() => {
    const handleOrderUpdate = (event) => {
      const { orderId, status, message, title } = event.detail
      const isMilkOrder = title?.toLowerCase().includes('milk') || message?.toLowerCase().includes('milk') || title?.toLowerCase().includes('dudhwala')
      
      if (!isMilkOrder) return

      const newNotification = {
        id: `order-${Date.now()}`,
        type: "milk",
        title: title || `Subscription #${orderId} ${status}`,
        message: message || `Your milk subscription status is now ${status}`,
        time: "Just now",
        timestamp: Date.now(),
        read: false,
        icon: "Milk",
        iconColor: "text-sky-600"
      }
      setLocalNotifications(prev => [newNotification, ...prev])
    }

    const handleDeliveryOtp = (event) => {
      const { orderId, otp, message } = event.detail
      const newNotification = {
        id: `otp-${Date.now()}`,
        type: "alert",
        title: "Delivery OTP",
        message: message || `Your OTP for milk delivery #${orderId} is ${otp}`,
        time: "Just now",
        timestamp: Date.now(),
        read: false,
        icon: "AlertCircle",
        iconColor: "text-orange-600"
      }
      setLocalNotifications(prev => [newNotification, ...prev])
    }

    window.addEventListener('orderStatusNotification', handleOrderUpdate)
    window.addEventListener('deliveryDropOtp', handleDeliveryOtp)

    return () => {
      window.removeEventListener('orderStatusNotification', handleOrderUpdate)
      window.removeEventListener('deliveryDropOtp', handleDeliveryOtp)
    }
  }, [])

  const mergedNotifications = useMemo(() => {
    const localItems = (localNotifications || []).map((item) => ({
      ...item,
      source: "local",
    }))
    
    const broadcastItems = (broadcastNotifications || []).filter(item => 
        item.title.toLowerCase().includes('milk') || 
        item.message.toLowerCase().includes('milk') ||
        item.title.toLowerCase().includes('dudhwala') ||
        item.category === 'milk'
    ).map((item) => ({
      ...item,
      source: "broadcast",
      type: "broadcast",
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
      timestamp: new Date(item.createdAt || Date.now()).getTime(),
      icon: "Bell",
      iconColor: "text-sky-600",
    }))

    return [...broadcastItems, ...localItems].sort(
      (a, b) => b.timestamp - a.timestamp
    )
  }, [broadcastNotifications, localNotifications])

  const unreadCount = localNotifications.filter(n => !n.read).length + broadcastUnreadCount

  const handleMarkAsRead = (id, source = "local") => {
    if (source === "broadcast") {
      markBroadcastAsRead(id)
      return
    }
    setLocalNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleClearAll = () => {
    setLocalNotifications([])
    dismissAllBroadcastNotifications()
  }

  const handleDeleteOne = (id, source = "local") => {
    if (source === "broadcast") {
      dismissBroadcastNotification(id)
      return
    }
    setLocalNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dudhwala">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
            {unreadCount > 0 && (
              <Badge className="bg-sky-600 text-white rounded-full px-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {mergedNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="text-slate-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-xs font-semibold uppercase tracking-wider">Clear All</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && mergedNotifications.length === 0 && (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-sky-600" />
            </div>
          )}

          {mergedNotifications.map((notification) => {
            const Icon = ICON_MAP[notification.icon] || Bell
            return (
              <Card
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id, notification.source)}
                className={`border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300 ${
                  !notification.read ? "bg-white dark:bg-[#1a1a1a] ring-1 ring-sky-100" : "bg-white/60 dark:bg-[#1a1a1a]/60 opacity-80"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      !notification.read ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className={`font-semibold text-base tracking-tight leading-tight truncate pr-2 ${!notification.read ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                          {notification.title}
                        </h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteOne(notification.id, notification.source); }}
                          className="text-slate-300 hover:text-red-500 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mb-2 font-medium">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <Clock size={10} />
                        {notification.time}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-sky-600 self-center" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {!loading && mergedNotifications.length === 0 && (
          <div className="py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-[#1a1a1a] mx-auto flex items-center justify-center text-slate-300 mb-4">
              <Bell size={40} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">No new alerts for your subscriptions.</p>
          </div>
        )}
      </div>
      <BottomNavigation />
    </AnimatedPage>
  )
}

