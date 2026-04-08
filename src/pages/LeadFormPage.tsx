import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeadForm from '../components/LeadForm';
import { useData } from '../contexts/DataContext';

const LeadFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { leads, addLead, updateLead } = useData();

    const isEditing = !!id;
    const leadToEdit = isEditing ? leads.find(l => l.id === id) : undefined;

    // Redirect to leads if editing but lead not found
    React.useEffect(() => {
        if (isEditing && !leadToEdit) {
            // Wait a bit for initial data load if leads is empty
            if (leads.length > 0) {
                navigate('/leads');
            }
        }
    }, [isEditing, leadToEdit, leads.length, navigate]);

    return (
        <LeadForm
            isEditing={isEditing}
            initialData={leadToEdit}
            onSave={async (lead) => {
                if (isEditing && id) {
                    await updateLead({ ...lead, id } as any);
                    navigate('/leads');
                } else {
                    const newLead = await addLead(lead as any);
                    if (newLead) {
                        navigate('/leads');
                    }
                }
            }}
        />
    );
};

export default LeadFormPage;
