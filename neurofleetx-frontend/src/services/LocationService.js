// ✅ Calculate distance between two locations using Google Maps API
export const calculateDistance = async (pickup, dropoff) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        pickup
      )}&destinations=${encodeURIComponent(dropoff)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.rows[0].elements[0].status === "OK") {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;
      const durationInSeconds = data.rows[0].elements[0].duration.value;
      const durationInMinutes = Math.ceil(durationInSeconds / 60);

      return {
        distance: parseFloat(distanceInKm.toFixed(2)),
        duration: durationInMinutes,
        durationText: `${Math.floor(durationInMinutes / 60)}h ${
          durationInMinutes % 60
        }m`,
      };
    } else {
      throw new Error("Could not calculate distance");
    }
  } catch (error) {
    console.error("Distance calculation error:", error);
    return { distance: 50, duration: 90, durationText: "1h 30m" }; // Default
  }
};

// ✅ Get coordinates from location text
export const getCoordinates = async (location) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng, formatted: data.results[0].formatted_address };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
};
