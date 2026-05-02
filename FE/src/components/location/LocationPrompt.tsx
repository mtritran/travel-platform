import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';

const LocationPrompt: React.FC = () => {
    const { location, detectLocation, updateManualLocation, isLoading } = useLocation();
    const { user } = useAuth();
    const [showManual, setShowManual] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Using Nominatim API (OpenStreetMap) which is more stable for global search
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=vi&countrycodes=vn`,
                    {
                        headers: {
                            'Accept-Language': 'vi'
                        }
                    }
                );
                
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                console.log('Search results:', data);

                const results = data.map((item: any) => ({
                    name: item.display_name.split(',').slice(0, 3).join(','),
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon)
                }));
                
                setSuggestions(results);
            } catch (err) {
                console.error('Search failed:', err);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN');

    if (location.latitude || isAdmin) return null;

    return (
        <div className="location-prompt-overlay" style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }}>
            <div className="location-prompt-card" style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '24px',
                maxWidth: '440px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ fontSize: '56px', marginBottom: '15px' }}>🗺️</div>
                <h2 style={{ marginBottom: '10px', color: '#1a202c', fontWeight: 800 }}>
                    Bạn đang ở đâu?
                </h2>
                <p style={{ marginBottom: '25px', color: '#718096', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    Cho phép TravelX biết vị trí của bạn để chúng mình gợi ý những tour du lịch gần nhất nhé.
                </p>

                {!showManual ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={() => detectLocation()}
                            disabled={isLoading}
                            style={{ 
                                width: '100%', 
                                height: '52px',
                                backgroundColor: isLoading ? '#bdc3c7' : '#2ecc71',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Đang xác định...' : '📍 Tự động xác định'}
                        </button>
                        <button
                            onClick={() => setShowManual(true)}
                            style={{ 
                                width: '100%', 
                                height: '52px',
                                backgroundColor: 'transparent',
                                color: '#3498db',
                                border: '2px solid #3498db',
                                borderRadius: '12px',
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                        >
                            🔍 Nhập địa chỉ thủ công
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <input
                                type="text"
                                placeholder="Nhập địa chỉ của bạn (vd: Đà Nẵng...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #edf2f7',
                                    outline: 'none',
                                    fontSize: '15px',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {isSearching && (
                                <div style={{ 
                                    position: 'absolute', 
                                    right: '12px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    fontSize: '12px',
                                    color: '#718096'
                                }}>Đang tìm...</div>
                            )}
                        </div>

                        <div style={{ 
                            maxHeight: '220px', 
                            overflowY: 'auto', 
                            marginBottom: '20px',
                            borderRadius: '12px',
                            border: suggestions.length > 0 ? '1px solid #edf2f7' : 'none'
                        }}>
                            {suggestions.map((city, idx) => (
                                <div
                                    key={`${city.name}-${idx}`}
                                    onClick={() => updateManualLocation(city.lat, city.lng, city.name)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #f7fafc',
                                        transition: 'background 0.2s',
                                        fontSize: '0.9rem',
                                        color: '#2d3748',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span>📍</span>
                                    <span style={{ flex: 1 }}>{city.name}</span>
                                </div>
                            ))}
                            {searchQuery.length >= 3 && !isSearching && suggestions.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '20px', color: '#a0aec0', fontSize: '0.85rem' }}>
                                    Không tìm thấy địa chỉ này.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => setShowManual(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'none',
                                border: 'none',
                                color: '#718096',
                                fontSize: '14px',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Quay lại
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationPrompt;
