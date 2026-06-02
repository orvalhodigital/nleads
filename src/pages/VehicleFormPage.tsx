
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
    console.log('VehicleFormPage:', { id, isEditing, vehiclesLength: vehicles.length, vehicleToEdit });

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
            onSave={async (v) => {
                try {
                    if (isEditing && id) {
                        await updateVehicle({ ...v, id } as any);
                    } else {
                        await addVehicle(v as any);
                    }
                } catch (err: any) {
                    console.error('Erro ao salvar veículo:', err);
                    const errorMsg = err.message || err.details || JSON.stringify(err);
                    alert(`Erro ao salvar veículo: ${errorMsg}`);
                    throw err; // Re-throw to prevent navigation in the form
                }
            }}
        />
    );
};

export default VehicleFormPage;
