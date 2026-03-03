import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setPosition(pos);
                },
            }}
        />
    );
}

const MapCoordinatePicker = ({ coordinates, setCoordinates }) => {
    const defaultCenter = [6.5244, 3.3792]; // Lagos, Nigeria roughly
    const mapRef = useRef(null);

    const position = (coordinates?.lat !== null && coordinates?.lng !== null && coordinates?.lat !== undefined)
        ? { lat: coordinates.lat, lng: coordinates.lng }
        : null;

    const handleSetPosition = (pos) => {
        setCoordinates({ lat: pos.lat, lng: pos.lng });
    };

    return (
        <div className="w-full flex flex-col gap-2 relative z-0">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-700">Map Pin Location <span className="text-gray-400 font-normal">(Optional but recommended)</span></label>
            </div>
            <p className="text-xs text-gray-500 mb-2">Click or drag the pin on the map to mark the exact GPS coordinates.</p>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={11}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={handleSetPosition} />
                </MapContainer>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                <div className="flex-1 flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 w-8">Lat:</label>
                    <input
                        type="number"
                        step="any"
                        value={position?.lat !== undefined && position?.lat !== null ? position.lat : ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            setCoordinates({ lat: val, lng: position?.lng || null });
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-brand-green outline-none shadow-sm"
                        placeholder="e.g. 6.5244"
                    />
                </div>
                <div className="flex-1 flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 w-8">Lng:</label>
                    <input
                        type="number"
                        step="any"
                        value={position?.lng !== undefined && position?.lng !== null ? position.lng : ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            setCoordinates({ lat: position?.lat || null, lng: val });
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-brand-green outline-none shadow-sm"
                        placeholder="e.g. 3.3792"
                    />
                </div>
                <div className="shrink-0 w-16 text-right">
                    {position && (
                        <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline"
                            onClick={() => setCoordinates({ lat: null, lng: null })}
                        >
                            Clear Pin
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapCoordinatePicker;
