import React from 'react';
import { useSettings } from '@core/context/SettingsContext';

const MobileFooterMessage = () => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'ChotuuMart';
    return (
        <div className="md:hidden w-full flex flex-col items-center -mt-8 pt-0 pb-28 px-6 bg-transparent">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
                .funky-neon-text {
                    font-family: 'Pacifico', cursive;
                    color: #e6ffed;
                    -webkit-text-stroke: 1px #59df95;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    line-height: 1.2;
                }
            `}</style>
            <div className="w-full flex flex-col items-center">
                <h2 className="text-[38px] text-center funky-neon-text mt-4 mb-2">
                    Bhook lagi hai<br />Chotuu aa jaayga
                </h2>

                <img src="/quick_delivery_icon.png" alt="Delivery 3D Icon" className="w-48 h-48 object-contain mb-6 drop-shadow-lg" />

                <div className="w-full h-[1px] bg-slate-200 mt-2 mb-4"></div>

                <div className="text-slate-300 font-black text-2xl tracking-tighter text-left">
                    OyeChotuu
                </div>
            </div>
        </div>
    );
};

export default MobileFooterMessage;
