import { useAuthContext } from '../contexts/AuthContext';

export function useBasePath(): string {
    const { impersonatedUserId } = useAuthContext();
    return impersonatedUserId ? `/paineldoadm/user/${impersonatedUserId}` : '';
}
