import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Upload, X, Calendar, Clock, Sparkles, Loader } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import Footer from "@food/components/user/Footer"
import { Button } from "@food/components/ui/button"
import { restaurantAPI, uploadAPI, customCakeAPI } from "@food/api"
import { toast } from "sonner"

export default function CustomCakeRequestForm() {
  const { restaurantId } = useParams()
  const navigate = useNavigate()

  const resolveRestaurantId = (candidate) => {
    if (!candidate || typeof candidate !== "object") return ""
    return String(
      candidate?._id ||
      candidate?.id ||
      candidate?.restaurantId ||
      candidate?.restaurant?._id ||
      candidate?.restaurant?.id ||
      candidate?.restaurant?.restaurantId ||
      ""
    ).trim()
  }
  
  const [bakery, setBakery] = useState(null)
  const [loadingBakery, setLoadingBakery] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  // Form states
  const [cakeType, setCakeType] = useState("")
  const [flavour, setFlavour] = useState("")
  const [weight, setWeight] = useState(1.0)
  const [shape, setShape] = useState("Round")
  const [theme, setTheme] = useState("")
  const [eggless, setEggless] = useState(true)
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [cakeMessage, setCakeMessage] = useState("")
  const [notes, setNotes] = useState("")
  const [images, setImages] = useState([])

  useEffect(() => {
    const fetchBakery = async () => {
      try {
        setLoadingBakery(true)
        const response = await restaurantAPI.getRestaurantById(restaurantId)
        if (response?.data?.success && response?.data?.data) {
          const bakeryDoc = response?.data?.data?.restaurant || response?.data?.data
          setBakery(bakeryDoc)
        } else {
          toast.error("Bakery details not found.")
        }
      } catch (error) {
        console.error("Error fetching bakery details:", error)
        toast.error("Failed to load bakery info.")
      } finally {
        setLoadingBakery(false)
      }
    }
    fetchBakery()
  }, [restaurantId])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploadingImage(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const response = await uploadAPI.uploadMedia(file, { folder: "custom_cakes" })
        if (response?.data?.success && response?.data?.data?.url) {
          return response.data.data.url
        }
        throw new Error("Upload failed")
      })

      const urls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...urls])
      toast.success("Images uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload some images.")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (submitting) return

    if (!cakeType.trim()) {
      toast.error("Please enter a cake type (e.g. Birthday Cake, Wedding Cake)")
      return
    }
    if (!flavour.trim()) {
      toast.error("Please enter a flavour")
      return
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date")
      return
    }
    if (!deliveryTime) {
      toast.error("Please select a delivery time")
      return
    }

    // Combine date and time
    const combinedDateTime = new Date(`${deliveryDate}T${deliveryTime}`)
    if (isNaN(combinedDateTime.getTime())) {
      toast.error("Invalid delivery date/time")
      return
    }

    if (combinedDateTime < new Date()) {
      toast.error("Delivery date/time cannot be in the past")
      return
    }

    setSubmitting(true)
    try {
      const resolvedRestaurantId = resolveRestaurantId(bakery)
      if (!resolvedRestaurantId) {
        toast.error("Bakery पहचान नहीं हुई. Please reopen this bakery and try again.")
        setSubmitting(false)
        return
      }

      const payload = {
        restaurantId: resolvedRestaurantId,
        cakeType,
        flavour,
        weight: Number(weight),
        shape,
        theme,
        eggless,
        deliveryDate: combinedDateTime.toISOString(),
        cakeMessage,
        notes,
        images,
      }

      const response = await customCakeAPI.createRequest(payload)
      if (response?.data?.success) {
        toast.success("Custom cake request submitted successfully!")
        navigate("/food/user/orders")
      } else {
        toast.error(response?.data?.message || "Failed to submit request.")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error(error?.response?.data?.message || "An error occurred while submitting.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingBakery) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-10 w-10 text-pink-500 animate-spin" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Loading bakery details...</span>
        </div>
      </div>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#f8fafc] dark:bg-neutral-900 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 md:px-8 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to={`/food/user/restaurants/${bakery?.slug || restaurantId}`}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              Custom Cake Request
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For {bakery?.name || "Home Bakery"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cake Basics Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-pink-600 border-b border-slate-200 dark:border-neutral-700 pb-2">
              1. Cake Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Cake Occasion / Type *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Birthday Cake, Anniversary, Wedding"
                  value={cakeType}
                  onChange={(e) => setCakeType(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Flavour *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chocolate Truffle, Butterscotch, Strawberry"
                  value={flavour}
                  onChange={(e) => setFlavour(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Weight (in kg) *
                </label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value={0.5}>0.5 kg (Ideal for 4-6 people)</option>
                  <option value={1.0}>1.0 kg (Ideal for 8-12 people)</option>
                  <option value={1.5}>1.5 kg (Ideal for 12-15 people)</option>
                  <option value={2.0}>2.0 kg (Ideal for 15-20 people)</option>
                  <option value={3.0}>3.0 kg (Ideal for 25-30 people)</option>
                  <option value={4.0}>4.0 kg</option>
                  <option value={5.0}>5.0 kg+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Shape *
                </label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="Round">Round</option>
                  <option value="Square">Square</option>
                  <option value="Heart">Heart</option>
                  <option value="Rectangle">Rectangle</option>
                  <option value="Custom">Custom / Tiered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Design & Theme Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-pink-600 border-b border-slate-200 dark:border-neutral-700 pb-2">
              2. Design & Customization
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Theme Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Spiderman Theme, Pastel Floral, Gold accents"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-700">
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white">Eggless Option</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">100% vegetarian cake base</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={eggless}
                  onChange={(e) => setEggless(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Message on Cake (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Happy 10th Birthday Aarav!"
                value={cakeMessage}
                onChange={(e) => setCakeMessage(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Special Instructions / Notes
              </label>
              <textarea
                placeholder="Describe layers, colors, font styling, or any specific details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Reference Images */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-pink-600 border-b border-slate-200 dark:border-neutral-700 pb-2">
              3. Reference Designs / Photos
            </h2>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload up to 3 pictures showing design inspirations or sketches.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 group">
                  <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-slate-100 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-600 hover:border-pink-500/60 dark:hover:border-pink-500/60 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-500 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploadingImage ? (
                    <Loader className="h-5 w-5 animate-spin text-pink-500" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Delivery & Time */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-pink-600 border-b border-slate-200 dark:border-neutral-700 pb-2">
              4. Delivery Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Delivery Date *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Preferred Time *
                </label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Note: bakeries usually require 24-48 hours for preparation of custom theme designs.
            </p>
          </div>

          {/* Submit Block */}
          <div className="pt-4 pb-8">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-sm h-12 rounded-full transition-all duration-300 shadow-lg shadow-pink-500/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                "Submit Custom Cake Request"
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </AnimatedPage>
  )
}
