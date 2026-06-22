import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MilkAddressSelector from '../components/MilkAddressSelector';

const SelectAddress = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSelect = (address) => {
        // Return to the previous page with the selected address in state
        const from = location.state?.from || '/dudhwala/subscribe';
        navigate(from, { 
            state: { 
                ...location.state,
                selectedAddress: address 
            },
            replace: true 
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <MilkAddressSelector 
                onSelect={handleSelect}
                onCancel={() => navigate(-1)}
            />
        </div>
    );
};

export default SelectAddress;
