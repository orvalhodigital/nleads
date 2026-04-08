import React from 'react';
import PhoneInventory from '../components/PhoneInventory';
import { useData } from '../contexts/DataContext';

const PhonesPage: React.FC = () => {
    const {
        phones, addPhone, updatePhone, deletePhone, handleSellPhone
    } = useData();

    return (
        <PhoneInventory
            phones={phones}
            onAddPhone={addPhone}
            onUpdatePhone={updatePhone}
            onDeletePhone={deletePhone}
            onSellPhone={handleSellPhone}
        />
    );
};

export default PhonesPage;
