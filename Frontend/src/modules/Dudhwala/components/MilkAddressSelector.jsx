import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Home, Building2, Briefcase, Search, X, Edit2, Trash2 } from "lucide-react";
import { Button } from "@food/components/ui/button";
import { Input } from "@food/components/ui/input";
import { Label } from "@food/components/ui/label";
import { toast } from "sonner";
import { dudhwalaAPI } from "@/services/api";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { loadGoogleMaps } from "@/core/services/googleMapsLoader";
import { useAuth } from "@core/context/AuthContext";
import { useNavigate } from "react-router-dom";

const MAPS_ENABLED = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getAddressIcon = (address) => {
  const label = (address.label || "").toLowerCase();
  if (label.includes("home")) return Home;
  if (label.includes("work") || label.includes("office")) return Briefcase;
  if (label.includes("building") || label.includes("apt")) return Building2;
  return Home;
};

export default function MilkAddressSelector({ onSelect, onCancel }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [mapPosition, setMapPosition] = useState([22.7196, 75.8577]);
  const [addressFormData, setAddressFormData] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    additionalDetails: "",
    label: "Home",
  });
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [addressAutocompleteValue, setAddressAutocompleteValue] = useState("");
  const [keywordAddressSuggestions, setKeywordAddressSuggestions] = useState([]);
  const [isKeywordSearching, setIsKeywordSearching] = useState(false);
  const [GOOGLE_MAPS_API_KEY, setGOOGLE_MAPS_API_KEY] = useState(null);
  const [formScrollTop, setFormScrollTop] = useState(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [baseMapHeight, setBaseMapHeight] = useState(320);
  const formBodyRef = useRef(null);
  const manualFieldRefs = useRef({});
  const [editingAddressId, setEditingAddressId] = useState(null);

  const handleEdit = (e, addr) => {
    e.stopPropagation();
    setAddressFormData({
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      additionalDetails: addr.additionalDetails || "",
      label: addr.label || "Home",
    });
    if (addr.location?.coordinates) {
       setMapPosition([addr.location.coordinates[1], addr.location.coordinates[0]]);
    }
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await dudhwalaAPI.deleteAddress(id);
      if (res.data.success) {
        toast.success("Address deleted successfully");
        fetchAddresses();
      }
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await dudhwalaAPI.getAddresses();
      if (res.data.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch milk addresses:", err);
    } finally {
      setFetchingAddresses(false);
    }
  };

  useEffect(() => {
    if (!MAPS_ENABLED) return;
    import('@food/utils/googleMapsApiKey.js').then(({ getGoogleMapsApiKey }) => {
      getGoogleMapsApiKey().then(key => setGOOGLE_MAPS_API_KEY(key));
    });
  }, []);

  useEffect(() => {
    if (!showAddressForm) return;
    const q = String(addressAutocompleteValue || "").trim();
    if (q.length < 3) {
      setKeywordAddressSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setIsKeywordSearching(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        const json = await res.json();
        setKeywordAddressSuggestions(json.map(r => ({
          id: r.place_id,
          display: r.display_name,
          lat: Number(r.lat),
          lng: Number(r.lon),
          address: r.address || {}
        })));
      } catch (e) {
        setKeywordAddressSuggestions([]);
      } finally {
        setIsKeywordSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [addressAutocompleteValue, showAddressForm]);

  useEffect(() => {
    if (!showAddressForm || !mapContainerRef.current || !GOOGLE_MAPS_API_KEY) return;
    const initMap = async () => {
      try {
        setMapLoading(true);
        const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        const google = window.google;
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: mapPosition[0], lng: mapPosition[1] },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });
        googleMapRef.current = map;
        map.addListener("idle", () => {
          const center = map.getCenter();
          const lat = center.lat();
          const lng = center.lng();
          setMapPosition([lat, lng]);
          handleReverseGeocode(lat, lng);
        });
        setMapLoading(false);
      } catch (err) {
        setMapLoading(false);
      }
    };
    initMap();
  }, [showAddressForm, GOOGLE_MAPS_API_KEY]);

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.address) {
        const addr = json.address;
        const street = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).slice(0, 2).join(", ");
        setCurrentAddress(json.display_name);
        setAddressFormData(prev => ({
          ...prev,
          street: street || json.display_name.split(",")[0],
          city: addr.city || addr.town || addr.village || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
        }));
      }
    } catch (e) {}
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please login to save address");
      navigate("/user/auth/login", { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!addressFormData.street || !addressFormData.city || !addressFormData.pincode) {
      toast.error("Required fields missing");
      return;
    }
    setLoadingAddress(true);
    try {
      const payload = {
        ...addressFormData,
        location: { type: "Point", coordinates: [mapPosition[1], mapPosition[0]] }
      };
      
      let res;
      if (editingAddressId) {
        res = await dudhwalaAPI.updateAddress(editingAddressId, payload);
      } else {
        res = await dudhwalaAPI.addAddress(payload);
      }

      if (res.data.success) {
        toast.success(editingAddressId ? "Address updated successfully" : "Address saved for Milk Subscriptions");
        await fetchAddresses();
        setShowAddressForm(false);
        setEditingAddressId(null);
        onSelect(res.data.data);
      }
    } catch (error) {
      toast.error(editingAddressId ? "Failed to update address" : "Failed to save address");
    } finally {
      setLoadingAddress(false);
    }
  };

  if (showAddressForm) {
    return (
      <AnimatedPage className="fixed inset-0 z-[60] bg-white dark:bg-[#0a0a0a] flex flex-col">
        <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-sky-600">{editingAddressId ? "Edit" : "Add"} Milk Delivery Address</h1>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          {/* Map */}
          <div className="h-[300px] relative bg-gray-100">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="mb-8 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center border-2 border-sky-600">
                   <div className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                </div>
                <div className="w-1 h-6 bg-sky-600" />
              </div>
            </div>
          </div>
 
           <div className="p-4 space-y-6 -mt-6 bg-white dark:bg-[#0a0a0a] rounded-t-3xl relative z-10 shadow-2xl">
            <div>
               <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Street / Area</Label>
               <Input 
                 value={addressFormData.street} 
                 onChange={e => setAddressFormData({...addressFormData, street: e.target.value.replace(/[^a-zA-Z0-9\s,.-]/g, '')})}
                 className="mt-1 h-12 rounded-xl focus:ring-sky-500"
               />
            </div>
            <div>
               <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">House / Flat No.</Label>
               <Input 
                 placeholder="E.g. Flat 402, 4th Floor"
                 value={addressFormData.additionalDetails} 
                 onChange={e => setAddressFormData({...addressFormData, additionalDetails: e.target.value.replace(/[^a-zA-Z0-9\s,.-]/g, '')})}
                 className="mt-1 h-12 rounded-xl border-sky-100 focus:ring-sky-500"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">City</Label>
                  <Input value={addressFormData.city} onChange={e => setAddressFormData({...addressFormData, city: e.target.value.replace(/[^a-zA-Z0-9\s]/g, '')})} className="mt-1 h-12 rounded-xl" />
               </div>
               <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pincode</Label>
                  <Input value={addressFormData.pincode} onChange={e => setAddressFormData({...addressFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} className="mt-1 h-12 rounded-xl" />
               </div>
            </div>
            <div>
               <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Label</Label>
               <div className="flex gap-2 mt-1">
                 {["Home", "Work", "Other"].map(l => (
                   <Button 
                     key={l}
                     variant={addressFormData.label === l ? "default" : "outline"}
                     onClick={() => setAddressFormData({...addressFormData, label: l})}
                     className={`flex-1 rounded-xl h-12 ${addressFormData.label === l ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                   >
                     {l}
                   </Button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t fixed bottom-0 left-0 right-0 z-20">
          <Button 
            className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl" 
            onClick={handleSubmit}
            disabled={loadingAddress}
          >
            {loadingAddress ? "Saving..." : "Save Milk Address"}
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0a0a0a] flex flex-col h-screen">
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Milk Delivery Address</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Your Milk Addresses</h2>
          <Button variant="ghost" className="text-sky-600 p-0 h-auto font-bold" onClick={() => {
             setEditingAddressId(null);
             setAddressFormData({ street: "", city: "", state: "", pincode: "", additionalDetails: "", label: "Home" });
             setShowAddressForm(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>

        <div className="space-y-4">
          {fetchingAddresses ? (
            <div className="py-10 text-center animate-pulse text-slate-400">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-10 opacity-50 bg-slate-50 rounded-3xl border-2 border-dashed">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No milk addresses saved yet</p>
            </div>
          ) : (
            addresses.map((addr) => {
              const Icon = getAddressIcon(addr);
              return (
                <div
                  key={addr._id}
                  className="w-full flex items-start gap-4 p-5 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-sky-200 transition-all text-left shadow-sm hover:shadow-md"
                >
                  <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 flex-shrink-0 cursor-pointer" onClick={() => onSelect(addr)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(addr)}>
                    <div className="flex items-center gap-2 mb-1">
                       <p className="font-bold text-slate-900 dark:text-white capitalize">{addr.label || 'Home'}</p>
                       {addr.isDefault && <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold uppercase">Default</span>}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{addr.street}, {addr.additionalDetails}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{addr.city}, {addr.pincode}</p>
                  </div>
                  <div className="flex items-center gap-1 self-center">
                    <button onClick={(e) => handleEdit(e, addr)} className="p-2 text-slate-400 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-full transition-colors" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => handleDelete(e, addr._id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
