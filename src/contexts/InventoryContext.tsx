import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { vehicleService } from '../services/vehicleService';
import { motorcycleService } from '../services/motorcycleService';
import { Vehicle, Motorcycle, SaleDetails } from '../types';
import { validateVehicleInput } from '../schemas/vehicleSchema';
import { isLimitedPlan } from '../lib/planAccess';
import { useAuthContext } from './AuthContext';
import { useToast } from './ToastContext';

const EMPRESA_ROLES = ['empresa', 'super_admin', 'admin'] as const;
const isEmpresaRole = (role?: string): boolean => EMPRESA_ROLES.includes(role as any);

const getAdminContext = (p: any | null) => {
  const isEmpresa = isEmpresaRole(p?.role);
  const adminId: string | undefined = isEmpresa ? p?.id : p?.parent_id ?? undefined;
  return { isEmpresa, adminId };
};

export interface InventoryContextType {
  vehicles: Vehicle[];
  motorcycles: Motorcycle[];
  refreshVehicles: () => Promise<void>;
  refreshMotorcycles: () => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (vehicle: Vehicle) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
  handleSellVehicle: (id: string, details: SaleDetails) => Promise<void>;
  addMotorcycle: (moto: Omit<Motorcycle, 'id'>) => Promise<Motorcycle>;
  updateMotorcycle: (moto: Motorcycle) => Promise<Motorcycle>;
  deleteMotorcycle: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({} as InventoryContextType);

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventoryContext must be used within an InventoryContextProvider');
  return context;
};

export const InventoryContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const { profileRef } = useAuthContext();
  const { showToast } = useToast();

  const refreshVehicles = useCallback(async () => {
    try {
      const { adminId } = getAdminContext(profileRef.current);
      const data = await vehicleService.getAll(undefined, adminId);
      setVehicles(data);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  }, [profileRef]);

  const refreshMotorcycles = useCallback(async () => {
    try {
      const { adminId } = getAdminContext(profileRef.current);
      const data = await motorcycleService.getAll(undefined, adminId);
      setMotorcycles(data);
    } catch (err) {
      console.error('Error loading motorcycles:', err);
    }
  }, [profileRef]);

  const addVehicle = useCallback(
    async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
      const isFreePlan = isLimitedPlan(profileRef.current?.plan);
      if (isFreePlan && vehicles.length + motorcycles.length >= 10) {
        showToast('error', 'Limite do plano gratuito atingido (máximo 10 itens no estoque). Faça o upgrade para cadastrar mais.');
        throw new Error('Limite do plano atingido');
      }

      const errors = validateVehicleInput(vehicleData);
      if (errors && errors.length > 0) {
        showToast('error', errors[0]);
        throw new Error(errors[0]);
      }

      try {
        const newVehicle = await vehicleService.create(vehicleData);
        setVehicles((prev) => [newVehicle, ...prev]);
        showToast('success', 'Veículo adicionado com sucesso!');
        return newVehicle;
      } catch (err) {
        showToast('error', 'Erro ao adicionar veículo.');
        throw err;
      }
    },
    [vehicles.length, motorcycles.length, profileRef, showToast]
  );

  const updateVehicle = useCallback(
    async (vehicleData: Vehicle): Promise<Vehicle> => {
      const errors = validateVehicleInput(vehicleData);
      if (errors && errors.length > 0) {
        showToast('error', errors[0]);
        throw new Error(errors[0]);
      }

      try {
        const updated = await vehicleService.update(vehicleData);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        showToast('success', 'Veículo atualizado com sucesso!');
        return updated;
      } catch (err) {
        showToast('error', 'Erro ao atualizar veículo.');
        throw err;
      }
    },
    [showToast]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      try {
        await vehicleService.delete(id);
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        showToast('success', 'Veículo excluído com sucesso!');
      } catch (err) {
        showToast('error', 'Erro ao excluir veículo.');
      }
    },
    [showToast]
  );

  const handleSellVehicle = useCallback(
    async (id: string, details: SaleDetails) => {
      try {
        await vehicleService.sell(id, details);
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: 'sold',
                  saleDetails: details,
                }
              : v
          )
        );
        showToast('success', 'Venda registrada com sucesso!');
      } catch (err) {
        showToast('error', 'Erro ao registrar venda.');
      }
    },
    [showToast]
  );

  const addMotorcycle = useCallback(
    async (motoData: Omit<Motorcycle, 'id'>): Promise<Motorcycle> => {
      const isFreePlan = isLimitedPlan(profileRef.current?.plan);
      if (isFreePlan && vehicles.length + motorcycles.length >= 10) {
        showToast('error', 'Limite do plano gratuito atingido (máximo 10 itens no estoque). Faça o upgrade para cadastrar mais.');
        throw new Error('Limite do plano atingido');
      }

      try {
        const newMoto = await motorcycleService.create(motoData);
        setMotorcycles((prev) => [newMoto, ...prev]);
        showToast('success', 'Moto adicionada com sucesso!');
        return newMoto;
      } catch (err) {
        showToast('error', 'Erro ao adicionar moto.');
        throw err;
      }
    },
    [vehicles.length, motorcycles.length, profileRef, showToast]
  );

  const updateMotorcycle = useCallback(
    async (motoData: Motorcycle): Promise<Motorcycle> => {
      try {
        const updated = await motorcycleService.update(motoData);
        setMotorcycles((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        showToast('success', 'Moto atualizada com sucesso!');
        return updated;
      } catch (err) {
        showToast('error', 'Erro ao atualizar moto.');
        throw err;
      }
    },
    [showToast]
  );

  const deleteMotorcycle = useCallback(
    async (id: string) => {
      try {
        await motorcycleService.delete(id);
        setMotorcycles((prev) => prev.filter((m) => m.id !== id));
        showToast('success', 'Moto excluída com sucesso!');
      } catch (err) {
        showToast('error', 'Erro ao excluir moto.');
      }
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      vehicles,
      motorcycles,
      refreshVehicles,
      refreshMotorcycles,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      handleSellVehicle,
      addMotorcycle,
      updateMotorcycle,
      deleteMotorcycle,
    }),
    [
      vehicles,
      motorcycles,
      refreshVehicles,
      refreshMotorcycles,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      handleSellVehicle,
      addMotorcycle,
      updateMotorcycle,
      deleteMotorcycle,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};
