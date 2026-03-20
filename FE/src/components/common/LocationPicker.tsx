import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMapEvents, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin } from 'lucide-react';

// Fix default marker icon issue with Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialLat = 21.0285, // Hanoi
  initialLng = 105.8542 
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Component to handle map clicks
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  // Component to fly to the searched location
  const ChangeView = ({ center }: { center: L.LatLng }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, 15);
    }, [center, map]);
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await resp.json();
      const addr = data.display_name || 'Không xác định được địa chỉ';
      setAddress(addr);
      onLocationSelect(lat, lng, addr);
    } catch (err) {
        console.error("Reverse geocoding error:", err);
    } finally {
        setLoading(false);
    }
  };

  const handeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    try {
        const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=vi`
        );
        const data = await resp.json();
        if (data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            const newPos = new L.LatLng(lat, lon);
            setPosition(newPos);
            setAddress(result.display_name);
            onLocationSelect(lat, lon, result.display_name);
        } else {
            alert("Không tìm thấy địa điểm này.");
        }
    } catch (err) {
        console.error("Search error:", err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Search Input */}
      <form onSubmit={handeSearch} style={{ position: 'relative' }}>
         <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-secondary)',
            zIndex: 10
         }} />
         <input 
            type="text" 
            placeholder="Tìm địa điểm trên bản đồ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
                paddingLeft: '40px', 
                paddingRight: '100px',
                width: '100%',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--surface)'
            }}
         />
         <button 
            type="submit"
            className="btn-primary"
            style={{ 
                position: 'absolute', 
                right: '4px', 
                top: '4px', 
                bottom: '4px', 
                padding: '0 16px',
                borderRadius: '8px',
                fontSize: '0.8125rem'
            }}
            disabled={loading}
         >
            {loading ? 'đang...' : 'Tìm'}
         </button>
      </form>

      {/* Map Content */}
      <div 
        className="glass-panel" 
        style={{ 
            height: '400px', 
            width: '100%', 
            overflow: 'hidden', 
            borderRadius: '16px',
            position: 'relative'
        }}
      >
        <MapContainer 
            center={[initialLat, initialLng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          {position && <Marker position={position} icon={DefaultIcon} />}
          {position && <ChangeView center={position} />}
        </MapContainer>
      </div>

      {address && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
             <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--primary)' }} />
             <span>{address}</span>
          </div>
      )}
    </div>
  );
};

export default LocationPicker;
