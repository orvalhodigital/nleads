
import React from 'react';
import UserArea from '../components/UserArea';
import { useData } from '../contexts/DataContext';

const PlansPage: React.FC = () => {
    const { profile, loadData } = useData();

    return (
        <UserArea
            profile={profile}
            onUpgrade={(plan) => {
                const paymentLink = plan.stripe_url || 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
                const url = profile?.email
                    ? `${paymentLink}${paymentLink.includes('?') ? '&' : '?'}prefilled_email=${encodeURIComponent(profile.email)}`
                    : paymentLink;
                window.open(url, '_blank');
            }}
            onProfileUpdate={loadData}
        />
    );
};

export default PlansPage;
