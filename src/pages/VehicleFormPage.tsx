
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VehicleForm from '../components/VehicleForm';
import { useData } from '../contexts/DataContext';

const VehicleFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { vehicles, addVehicle, updateVehicle } = useData();

    const isEditing = !!id;
    const vehicleToEdit = isEditing ? vehicles.find(v => v.id === id) : undefined;

    // Redirect to inventory if editing but vehicle not found
    React.useEffect(() => {
        if (isEditing && !vehicleToEdit) {
            // Wait a bit for initial data load if vehicles is empty
            if (vehicles.length > 0) {
                navigate('/inventory');
            }
        }
    }, [isEditing, vehicleToEdit, vehicles.length, navigate]);

    return (
        <VehicleForm
            isEditing={isEditing}
            initialData={vehicleToEdit}
            onSave={(v) => {
                if (isEditing && id) {
                    updateVehicle({ ...v, id } as any);
                } else {
                    addVehicle(v as any);
                }
            }}
        />
    );
};

export default VehicleFormPage;
