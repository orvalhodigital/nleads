
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VehicleForm from '../components/VehicleForm';
import { useAuthContext } from '../contexts/AuthContext';
import { useInventoryContext } from '../contexts/InventoryContext';
import PageContainer from '../components/ui/PageContainer';
import PlanLimitAlert from '../components/PlanLimitAlert';
import { ArrowLeft } from 'lucide-react';
import { isLimitedPlan } from '../lib/planAccess';

const VehicleFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { profile } = useAuthContext();
    const { 
        vehicles, motorcycles, 
        addVehicle, updateVehicle, 
        addMotorcycle, updateMotorcycle 
    } = useInventoryContext();

    const isEditing = !!id;
    const vehicleToEdit = isEditing
        ? (vehicles.find(v => v.id === id) || motorcycles.find(m => m.id === id))
        : undefined;

    // Precisa rodar antes de qualquer `return` condicional abaixo — senão, ao
    // atingir o limite do plano Free entre um render e outro, o número de
    // hooks chamados muda e o React derruba a página ("Rendered more/fewer
    // hooks than during the previous render").
    React.useEffect(() => {
        if (isEditing && !vehicleToEdit) {
            // Wait a bit for initial data load if vehicles/motorcycles is empty
            if (vehicles.length > 0 || motorcycles.length > 0) {
                navigate('/inventory');
            }
        }
    }, [isEditing, vehicleToEdit, vehicles.length, motorcycles.length, navigate]);

    const isFreePlan = isLimitedPlan(profile?.plan);
    if (isFreePlan && !isEditing && (vehicles.length + motorcycles.length) >= 10) {
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

    return (
        <VehicleForm
            isEditing={isEditing}
            initialData={vehicleToEdit as any}
            onSave={async (v) => {
                try {
                    const isMoto = v.vehicleCategory === 'moto';
                    if (isEditing && id) {
                        if (isMoto) {
                            return await updateMotorcycle({ ...v, id } as any);
                        } else {
                            return await updateVehicle({ ...v, id } as any);
                        }
                    } else {
                        if (isMoto) {
                            return await addMotorcycle(v as any);
                        } else {
                            return await addVehicle(v as any);
                        }
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
