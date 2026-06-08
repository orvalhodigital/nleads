
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VehicleForm from '../components/VehicleForm';
import { useData } from '../contexts/DataContext';
import PageContainer from '../components/ui/PageContainer';
import PlanLimitAlert from '../components/PlanLimitAlert';
import { ArrowLeft } from 'lucide-react';

const VehicleFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { vehicles, motorcycles, profile, addVehicle, updateVehicle } = useData();

    const isEditing = !!id;
    const vehicleToEdit = isEditing ? vehicles.find(v => v.id === id) : undefined;

    if (profile?.plan !== 'pro' && !isEditing && (vehicles.length + motorcycles.length) >= 10) {
        return (
            <PageContainer className="pb-32 animate-fadeUp">
                <div className="flex items-center gap-6 mb-10">
                    <button
                        onClick={() => navigate('/inventory')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            Novo Veículo
                        </h1>
                    </div>
                </div>
                <div className="max-w-2xl">
                    <PlanLimitAlert
                        plan={profile?.plan || 'free'}
                        featureName="Veículos"
                        currentCount={vehicles.length + motorcycles.length}
                        limit={10}
                        email={profile?.email}
                    />
                </div>
            </PageContainer>
        );
    }

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
