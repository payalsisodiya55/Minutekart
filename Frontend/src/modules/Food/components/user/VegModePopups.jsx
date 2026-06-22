import React from 'react';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import foodIcon from "@/assets/c0a633fa42582f2a3752d4341dcfa5a2-removebg-preview.png";

const VegModePopups = ({ 
  showVegModePopup, 
  showSwitchOffPopup, 
  onCloseVegPopup, 
  onCloseSwitchOffPopup,
  onConfirmSwitchOff 
}) => {
  const [selectedOption, setSelectedOption] = React.useState("all");

  // Prevent body scroll when popups are open
  React.useEffect(() => {
    if (showVegModePopup || showSwitchOffPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVegModePopup, showSwitchOffPopup]);

  // Reset popup states on open
  React.useEffect(() => {
    if (showVegModePopup) {
      setSelectedOption("all");
    }
  }, [showVegModePopup]);

  return (
    <>
      {/* Pure Veg Mode Confirmation Overlay */}
      {createPortal(
        <AnimatePresence>
          {showVegModePopup && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onCloseVegPopup()}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-[#1a1a1a] rounded-[28px] p-6 sm:p-8 max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800"
              >
                {/* Close Button X on the top right */}
                <button
                  onClick={() => onCloseVegPopup()}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors z-20"
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>

                {/* Decorative Blur Background Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative mt-2">
                  {/* Header Row */}
                  <div className="flex justify-between items-center gap-3 mb-6 pr-6">
                    <h3 className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-tight flex-1">
                      I want to see veg choices from
                    </h3>
                    <motion.div
                      className="w-[84px] h-[60px] shrink-0"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <img
                        src={foodIcon}
                        alt="Veg choices"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                  </div>

                  {/* Radio Options List */}
                  <div className="flex flex-col gap-1 mb-5">
                    {/* All Restaurants Option */}
                    <div
                      onClick={() => setSelectedOption("all")}
                      className="flex items-center justify-between py-3 cursor-pointer group"
                    >
                      <span className="text-gray-700 dark:text-neutral-200 font-semibold text-base group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                        All restaurants
                      </span>
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedOption === "all"
                            ? "border-green-600 dark:border-green-500"
                            : "border-gray-300 dark:border-neutral-600"
                        }`}>
                          {selectedOption === "all" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pure Veg Option */}
                    <div
                      onClick={() => setSelectedOption("pure")}
                      className="flex items-center justify-between py-3 cursor-pointer group"
                    >
                      <span className="text-gray-700 dark:text-neutral-200 font-semibold text-base group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                        Pure veg restaurants only
                      </span>
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedOption === "pure"
                            ? "border-green-600 dark:border-green-500"
                            : "border-gray-300 dark:border-neutral-600"
                        }`}>
                          {selectedOption === "pure" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Show Restaurants Button */}
                  <button
                    onClick={() => onCloseVegPopup(selectedOption)}
                    className="w-full py-4 mt-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-lg shadow-green-500/20 transition-all duration-300 transform active:scale-95 text-base flex items-center justify-center"
                  >
                    Show restaurants
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Pure Veg Mode Switch Off Confirmation */}
      {createPortal(
        <AnimatePresence>
          {showSwitchOffPopup && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCloseSwitchOffPopup}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl overflow-hidden border border-orange-100 dark:border-orange-900/30"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />

                <div className="relative text-center">
                  <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-orange-50/50 dark:ring-orange-500/5">
                    <AlertCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Switching Off?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                    This will re-enable non-vegetarian options in your feed. Are you sure you want to continue?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={onConfirmSwitchOff}
                      className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Yes, Switch Off
                    </button>
                    <button
                      onClick={onCloseSwitchOffPopup}
                      className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all duration-300"
                    >
                      Keep it On
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default React.memo(VegModePopups);
