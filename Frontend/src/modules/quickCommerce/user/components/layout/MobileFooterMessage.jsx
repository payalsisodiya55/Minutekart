import React from 'react';
import { useSettings } from '@core/context/SettingsContext';
import bagImage from '@/assets/Gemini_Generated_Image_i9f6i1i9f6i1i9f6-removebg-preview.png';

const MobileFooterMessage = () => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'Instamart';
    return (
        <div className="md:hidden w-full flex flex-col items-center mt-8 pt-0 pb-32 px-6 bg-transparent">
            <div className="w-full flex flex-col items-center">
                <img src={bagImage} alt="Delivery Bag" className="w-48 h-48 object-contain mb-6 drop-shadow-lg" />

                <div className="w-full h-[1px] bg-slate-200 mt-2 mb-4"></div>

                <div className="text-slate-300 font-black text-2xl tracking-tighter text-left">
                    Minutekart
                </div>
            </div>
        </div>
    );
};

export default MobileFooterMessage;
