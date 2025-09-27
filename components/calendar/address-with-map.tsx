'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from '@react-google-maps/api';

interface AddressWithMapProps {
  street: string;
  city: string;
  postalCode: string;
  onStreetChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onLocationChange?: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '256px',
};

const center = {
  lat: 50.8503,
  lng: 4.3517,
};

const libraries: ("places")[] = ["places"];

export function AddressWithMap({
  street,
  city,
  postalCode,
  onStreetChange,
  onCityChange,
  onPostalCodeChange,
  onLocationChange,
}: AddressWithMapProps) {
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState(center);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const onLoad = useCallback((autocompleteInstance: any) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      console.log('Place selected:', place);
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setSelectedPlace(place);
        setMapCenter({ lat, lng });
        
        // Parse address components
        let streetNumber = '';
        let route = '';
        let city = '';
        let postalCode = '';
        
        if (place.address_components) {
          place.address_components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          });
        }
        
        // Combine route and street number for full street address (street name first)
        const fullStreet = [route, streetNumber].filter(Boolean).join(' ');
        
        // Update form fields
        if (fullStreet) onStreetChange(fullStreet);
        if (city) onCityChange(city);
        if (postalCode) onPostalCodeChange(postalCode);

        // Notify parent component
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }

        toast({
          title: 'Location Updated',
          description: 'Address has been geocoded and map updated',
        });
      }
    }
  }, [autocomplete, onStreetChange, onCityChange, onPostalCodeChange, onLocationChange]);


  const openInGoogleMaps = () => {
    if (street && city && postalCode) {
      const fullAddress = `${street}, ${city}, ${postalCode}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">
            <strong>Google Maps API Key Missing:</strong> Please add your Google Maps API key to the environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="w-full h-64 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-4">
        {/* Address Fields with Autocomplete on Street */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address_street">Street Address</Label>
            <div className="relative">
              <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  types: ['address'],
                  componentRestrictions: { country: 'be' },
                  fields: ['address_components', 'geometry', 'formatted_address'],
                }}
              >
                <Input
                  id="address_street"
                  value={street}
                  onChange={(e) => onStreetChange(e.target.value)}
                  placeholder="Start typing an address..."
                  className="pr-10 w-full"
                />
              </Autocomplete>
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500">
              Type to see address suggestions
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_city">City</Label>
            <Input
              id="address_city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Brussels"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address_postal_code">Postal Code</Label>
            <Input
              id="address_postal_code"
              value={postalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={openInGoogleMaps}
              disabled={!street || !city || !postalCode}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Maps
            </Button>
          </div>
        </div>

        {/* Map Preview */}
        <div className="space-y-2">
          <Label>Location Preview</Label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={selectedPlace ? 16 : 12}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location && (
              <Marker
                position={{
                  lat: selectedPlace.geometry.location.lat(),
                  lng: selectedPlace.geometry.location.lng(),
                }}
                title="Job Location"
              />
            )}
          </GoogleMap>
        </div>
      </div>
  );
}