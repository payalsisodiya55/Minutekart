import React from 'react';
import { MapPinOff, AlertCircle, RefreshCw, Construction } from 'lucide-react';
import { Button } from '@food/components/ui/button';
import { motion } from 'framer-motion';

export default function ServiceUnavailable({ type = "zone", moduleName = "", onRefresh }) {
  // Unique taglines based on module and type
  const getMessage = () => {
    if (type === "module") {
      return {
        title: "Currently Unavailable",
        desc: `Oops! ${moduleName} is currently undergoing maintenance. Chotuu will be back in action soon! 🛠️`,
        icon: <Construction className="w-16 h-16 text-orange-400" />
      };
    }
    
    // type === "zone"
    if (moduleName.toLowerCase().includes('food')) {
      return {
        title: "Coming Soon!",
        desc: "Chotuu aapke yahan abhi nahi aaya, par jald hi garma-garam khana layega! 🛵🍲",
        icon: <MapPinOff className="w-16 h-16 text-red-500" />
      };
    }
    if (moduleName.toLowerCase().includes('quick') || moduleName.toLowerCase().includes('mart')) {
      return {
        title: "Coming Soon!",
        desc: "Chotuu aapke yahan abhi nahi aaya, par 15 minute mein magic le aayega! ⚡🛒",
        icon: <MapPinOff className="w-16 h-16 text-green-500" />
      };
    }
    if (moduleName.toLowerCase().includes('milk') || moduleName.toLowerCase().includes('dudhwala')) {
      return {
        title: "Coming Soon!",
        desc: "Chotuu aapke yahan abhi nahi aaya, par subah-subah fresh doodh pahunchayega! 🥛☀️",
        icon: <MapPinOff className="w-16 h-16 text-blue-500" />
      };
    }

    return {
      title: "Coming Soon!",
      desc: "Oops! Chotuu aapke yahan abhi nahi aaya hai. Hum tezi se expand kar rahe hain, jald milenge! 🚀",
      icon: <MapPinOff className="w-16 h-16 text-gray-400" />
    };
  };

  const content = getMessage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ type: 'spring', damping: 15 }}
        className="w-32 h-32 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 shadow-inner"
      >
        {content.icon}
      </motion.div>
      
      <motion.h2 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.1 }}
        className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight"
      >
        {content.title}
      </motion.h2>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-sm mb-8 leading-relaxed font-medium"
      >
        {content.desc}
      </motion.p>

      {onRefresh && (
        <motion.div
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={onRefresh}
            variant="outline" 
            className="rounded-xl px-6 h-12 font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
