import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Clock, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, ArrowRight, Loader2, Sparkles, ShoppingBag } from "lucide-react"
import { customCakeAPI } from "@food/api"
import { useCart } from "@food/context/CartContext"
import { toast } from "sonner"

export default function CustomCakeRequests() {
  const navigate = useNavigate()
  const { replaceCart } = useCart()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // ID of request being confirmed
  const [selectedImage, setSelectedImage] = useState(null) // For image zoom modal

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await customCakeAPI.getRequests()
      let extractedRequests = []

      if (response?.data) {
        const body = response.data
        if (Array.isArray(body)) {
          extractedRequests = body
        } else if (body.data) {
          if (Array.isArray(body.data)) {
            extractedRequests = body.data
          } else if (Array.isArray(body.data.requests)) {
            extractedRequests = body.data.requests
          }
        } else if (Array.isArray(body.requests)) {
          extractedRequests = body.requests
        }
      } else if (Array.isArray(response)) {
        extractedRequests = response
      }

      setRequests(extractedRequests)
    } catch (error) {
      console.error("Error fetching custom cake requests:", error)
      toast.error("Failed to load custom cake requests.")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleConfirmAndCheckout = async (request) => {
    if (!request || !request._id) return

    setActionLoading(request._id)
    try {
      // 1. Call confirmQuotation API to update status in DB to 'confirmed'
      const response = await customCakeAPI.confirmQuotation(request._id)
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to confirm quotation.")
      }

      // 2. Prepare the custom cake cart item
      const cartItem = {
        id: `${request.restaurantId?._id || request.restaurantId}-custom-cake`,
        itemId: `${request.restaurantId?._id || request.restaurantId}-custom-cake`,
        name: `Custom Cake (${request.cakeType})`,
        price: Number(request.quotePrice),
        quantity: 1,
        image: request.images?.[0] || "",
        restaurant: request.restaurantId?.name || request.restaurantId?.restaurantName || "Home Bakery",
        restaurantId: request.restaurantId?._id || request.restaurantId,
        isCustomCake: true,
        customCakeRequestId: request._id,
        isVeg: !request.eggless,
      }

      // 3. Clear existing cart and replace with this single custom cake item
      replaceCart([cartItem])
      
      toast.success("Quotation confirmed! Redirecting to checkout...")
      
      // 4. Navigate directly to cart / checkout page
      navigate("/cart")
    } catch (error) {
      console.error("Error confirming quotation:", error)
      toast.error(error?.response?.data?.message || error.message || "Something went wrong.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectQuotation = async (request) => {
    if (!request || !request._id) return

    if (!window.confirm("Are you sure you want to decline this quotation? This request will be cancelled.")) {
      return
    }

    setActionLoading(request._id)
    try {
      const response = await customCakeAPI.userRejectQuotation(request._id)
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to decline quotation.")
      }
      toast.success("Quotation declined and request cancelled.")
      fetchRequests()
    } catch (error) {
      console.error("Error declining quotation:", error)
      toast.error(error?.response?.data?.message || error.message || "Something went wrong.")
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pending Quote
          </span>
        )
      case "quoted":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-600 border border-pink-200 animate-pulse">
            <Sparkles className="h-3 w-3" />
            Quote Received
          </span>
        )
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            Confirmed
          </span>
        )
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        )
      case "ordered":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <ShoppingBag className="h-3 w-3" />
            Ordered
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-pink-500 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Fetching your custom requests...</p>
      </div>
    )
  }

  const requestsList = Array.isArray(requests) ? requests : []

  if (requestsList.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-gray-800 p-10 text-center max-w-lg mx-auto mt-6">
        <div className="h-16 w-16 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-100 dark:border-pink-900/30">
          <Sparkles className="h-8 w-8 text-pink-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Custom Requests Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          Order unique custom-designed cakes from our Home Bakeries! Send specifications, choose flavours, shapes, and upload reference designs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requestsList.map((request) => {
        const restaurantName = request.restaurantId?.name || request.restaurantId?.restaurantName || "Home Bakery"
        const isQuoted = request.status === "quoted"
        const isOrdered = request.status === "ordered"
        const isRejected = request.status === "rejected"

        return (
          <div
            key={request._id}
            className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-2xl p-5 transition-all shadow-sm"
          >
            {/* Header info */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                  Request ID: {request.requestId || request._id?.slice(-8)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{restaurantName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              {/* Specs Badge summary */}
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                  {request.weight} kg • {request.shape}
                </span>
                {request.eggless && (
                  <span className="block mt-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider">
                    🍀 Eggless
                  </span>
                )}
              </div>
            </div>

            {/* Main Specs Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Occasion / Cake Type</span>
                  <span className="text-gray-900 dark:text-white font-medium">{request.cakeType}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Flavour</span>
                  <span className="text-gray-900 dark:text-white font-medium">{request.flavour}</span>
                </div>
                {request.cakeMessage && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Message on Cake</span>
                    <span className="text-pink-600 dark:text-pink-400 italic font-medium">"{request.cakeMessage}"</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Delivery Requested</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatDate(request.deliveryDate)}</span>
                  </div>
                </div>
                {request.notes && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Instructions / Notes</span>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 leading-relaxed">{request.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Images if any */}
            {request.images && request.images.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Reference Designs</span>
                <div className="flex flex-wrap gap-2">
                  {request.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="h-14 w-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-pink-400 transition-all cursor-pointer relative group bg-gray-50 dark:bg-gray-800"
                    >
                      <img src={img} alt="reference" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <ImageIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quotation pricing section */}
            {(request.quotePrice > 0 || isQuoted || isOrdered) && (
              <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-pink-600 font-bold block uppercase tracking-wider">
                    Bakery Quote
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">₹{request.quotePrice}</span>
                    {request.preparationTimeMinutes > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {request.preparationTimeMinutes} mins prep time
                      </span>
                    )}
                  </div>
                </div>

                {isQuoted && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleRejectQuotation(request)}
                      disabled={actionLoading !== null}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl border border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500/50 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {actionLoading === request._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Decline Quote
                    </button>
                    <button
                      onClick={() => handleConfirmAndCheckout(request)}
                      disabled={actionLoading !== null}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {actionLoading === request._id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm & Checkout
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isOrdered && request.orderId && (
                  <button
                    onClick={() => navigate(`/food/user/orders/${request.orderId}`)}
                    className="w-full md:w-auto px-5 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    Track Order
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Rejection notice */}
            {isRejected && request.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-red-600 font-bold block uppercase tracking-wider">
                    Rejection Reason
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-relaxed">{request.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Selected Image Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Clock className="h-6 w-6 rotate-45" /> {/* Use custom rotation or simple X */}
          </button>
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border border-gray-200 bg-white">
            <img src={selectedImage} alt="Zoomed view" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
