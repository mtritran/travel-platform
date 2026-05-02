import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface Location {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
}

interface LocationState {
    location: Location;
    permissionStatus: 'prompt' | 'granted' | 'denied';
    isLoading: boolean;
    isInitialized: boolean;
}

interface LocationContextType extends LocationState {
    detectLocation: () => Promise<void>;
    updateManualLocation: (lat: number, lng: number, address: string) => void;
    clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, refreshUser } = useAuth();
    const [state, setState] = useState<LocationState>({
        location: {
            latitude: null,
            longitude: null,
            address: null,
        },
        permissionStatus: 'prompt',
        isLoading: false,
        isInitialized: false,
    });

    // Load saved location from localStorage on mount BEFORE first render
    useEffect(() => {
        const saved = localStorage.getItem('user_location');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(prev => ({
                    ...prev,
                    location: parsed,
                    permissionStatus: 'granted',
                    isInitialized: true,
                }));
            } catch {
                localStorage.removeItem('user_location');
                setState(prev => ({ ...prev, isInitialized: true }));
            }
        } else {
            setState(prev => ({ ...prev, isInitialized: true }));
        }
    }, []);

    const detectLocation = async () => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                let address = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

                try {
                    // Two parallel requests: default for proper nouns (Khu vực 22), vi for city/province names
                    const [resDefault, resVi] = await Promise.all([
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`),
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`)
                    ]);
                    const [dataDefault, dataVi] = await Promise.all([resDefault.json(), resVi.json()]);

                    if (dataDefault?.address || dataVi?.address) {
                        const addrEn = dataDefault?.address || {};
                        const addrVi = dataVi?.address || {};

                        const area = addrEn.quarter || addrEn.neighbourhood || addrEn.suburb || "";

                        const city = addrVi.city || addrVi.town || addrVi.city_district || "";
                        const state = addrVi.state || addrVi.province || "";

                        const parts = [area, city, state].filter(Boolean);
                        address = parts.length > 0
                            ? parts.join(', ')
                            : (dataVi.display_name || dataDefault.display_name || "").split(',').slice(0, 3).join(', ');
                    }
                } catch (err) {
                    console.error('Reverse geocoding failed:', err);
                }

                const newLocation = { latitude, longitude, address };
                setState(prev => ({
                    ...prev,
                    location: newLocation,
                    permissionStatus: 'granted',
                    isLoading: false,
                }));

                localStorage.setItem('user_location', JSON.stringify(newLocation));
            },
            (error) => {
                console.error('Error detecting location:', error);
                setState(prev => ({
                    ...prev,
                    permissionStatus: 'denied',
                    isLoading: false
                }));
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const updateManualLocation = (latitude: number, longitude: number, address: string) => {
        const newLocation = { latitude, longitude, address };
        setState(prev => ({
            ...prev,
            location: newLocation,
            permissionStatus: 'granted',
            isLoading: false,
        }));
        localStorage.setItem('user_location', JSON.stringify(newLocation));
    };

    const clearLocation = async () => {
        // Reset local state
        setState({
            location: { latitude: null, longitude: null, address: null },
            permissionStatus: 'prompt',
            isLoading: false,
        });
        localStorage.removeItem('user_location');

        // Reset on server if logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await api.put('/users/location', {
                    latitude: null,
                    longitude: null,
                    address: null
                });
                await refreshUser();
            } catch (err) {
                console.error('Failed to clear location on server:', err);
            }
        }
    };

    // Clear location on logout
    useEffect(() => {
        if (!user && state.location.latitude) {
            clearLocation();
        }
    }, [user]);

    // Sync from user profile on login if local state is empty
    useEffect(() => {
        // Only sync if we don't have a local coordinate and the user has one on server
        if (user && !state.location.latitude && user.currentLat && user.currentLong) {
            const userLocation = {
                latitude: user.currentLat,
                longitude: user.currentLong,
                address: user.currentAddress
            };
            setState(prev => ({
                ...prev,
                location: userLocation,
                permissionStatus: 'granted'
            }));
            localStorage.setItem('user_location', JSON.stringify(userLocation));
        }
    }, [user]);

    // Sync with server if logged in and location exists
    useEffect(() => {
        const syncLocation = async () => {
            const token = localStorage.getItem('token');
            const { latitude, longitude, address } = state.location;

            if (token && latitude && longitude) {
                try {
                    await api.put('/users/location', {
                        latitude,
                        longitude,
                        address
                    });
                } catch (err) {
                    console.error('Failed to sync location to server:', err);
                }
            }
        };

        syncLocation();
    }, [state.location]);

    return (
        <LocationContext.Provider value={{ ...state, detectLocation, updateManualLocation, clearLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
