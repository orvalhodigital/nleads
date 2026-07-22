
import { useState, useEffect } from 'react';
import { systemSettingsService } from '../services/systemSettingsService';

const DEFAULT_LOGO_URL = '/branding/logos/logo-orvalho.png';

export interface SystemSettings {
    logoUrl: string | null;
    loading: boolean;
}

export const useSystemSettings = () => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await systemSettingsService.getByKeys(['logo_url', 'temp_logo_url', 'temp_logo_start', 'temp_logo_end']);

            if (data) {
                const settings = data.reduce((acc: any, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                const now = new Date();
                const start = settings['temp_logo_start'] ? new Date(settings['temp_logo_start']) : null;
                const end = settings['temp_logo_end'] ? new Date(settings['temp_logo_end']) : null;
                const tempUrl = settings['temp_logo_url'];

                if (tempUrl && start && end && now >= start && now <= end) {
                    setLogoUrl(tempUrl);
                } else {
                    setLogoUrl(settings['logo_url'] || DEFAULT_LOGO_URL);
                }
            } else {
                setLogoUrl(DEFAULT_LOGO_URL);
            }
        } catch (error) {
            console.error('Error loading system settings', error);
            setLogoUrl(DEFAULT_LOGO_URL);
        } finally {
            setLoading(false);
        }
    };

    return { logoUrl, loading };
};
