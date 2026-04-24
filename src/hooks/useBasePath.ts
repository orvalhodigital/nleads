import { useData } from '../contexts/DataContext';

export function useBasePath(): string {
    const { impersonatedUserId } = useData();
    return impersonatedUserId ? `/paineldoadm/user/${impersonatedUserId}` : '';
}
