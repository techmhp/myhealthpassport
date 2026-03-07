import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { pincode } = await params;

  console.log('🔍 Geocode API called for pincode:', pincode);

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ success: false, message: 'Invalid pincode format' }, { status: 400 });
  }

  try {
    // Try Nominatim first
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`;
    console.log('🌐 Trying Nominatim...');

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MyHealthPassport/1.0',
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();

      if (data && data.length > 0) {
        console.log('✅ Nominatim success');
        return NextResponse.json({
          success: true,
          latitude: data[0].lat,
          longitude: data[0].lon,
          place: data[0].display_name,
        });
      }
    }

    // Fallback: Try Positionstack API (free tier available)
    console.log('⚠️ Nominatim failed, trying fallback...');
    const positionstackUrl = `http://api.positionstack.com/v1/forward?access_key=YOUR_API_KEY&query=${pincode},India`;

    // For now, return static fallback based on pincode prefix
    const pincodePrefix = pincode.substring(0, 2);
    const fallbackCoords = getFallbackCoordinates(pincodePrefix);

    console.log('🔄 Using fallback coordinates');
    return NextResponse.json({
      success: true,
      latitude: fallbackCoords.lat,
      longitude: fallbackCoords.long,
      place: `India (Pincode: ${pincode})`,
    });
  } catch (error) {
    console.error('❌ Geocoding exception:', error);

    // Return fallback on error
    const pincodePrefix = pincode.substring(0, 2);
    const fallbackCoords = getFallbackCoordinates(pincodePrefix);

    return NextResponse.json({
      success: true,
      latitude: fallbackCoords.lat,
      longitude: fallbackCoords.long,
      place: `India (Pincode: ${pincode})`,
    });
  }
}

// Fallback coordinates based on pincode prefix (first 2 digits)
function getFallbackCoordinates(prefix) {
  const coordMap = {
    50: { lat: '17.385044', long: '78.486671' }, // Hyderabad
    51: { lat: '18.0011', long: '79.5880' }, // Warangal
    56: { lat: '12.9716', long: '77.5946' }, // Bangalore
    60: { lat: '13.0827', long: '80.2707' }, // Chennai
    40: { lat: '19.0760', long: '72.8777' }, // Mumbai
    11: { lat: '28.6139', long: '77.2090' }, // Delhi
  };

  return coordMap[prefix] || { lat: '20.5937', long: '78.9629' }; // Center of India
}
