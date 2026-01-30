async function initMap() {
  try {
    // Fetch data
    const response = await fetch("./db.json");
    const data = await response.json();
    const cities = data.cities || [];
    const properties = data.properties || [];

    // Import Google Maps Marker library
    const { AdvancedMarkerElement, PinElement } =
      await google.maps.importLibrary("marker");

    // Determine map center
    let mapCenter;
    if (cities.length) {
      mapCenter = { lat: cities[0].lat, lng: cities[0].lng };
    } else if (properties.length) {
      mapCenter = { lat: properties[0].lat, lng: properties[0].lng };
    } else {
      mapCenter = { lat: 0, lng: 0 }; // default fallback
    }

    // Create a new map
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 6,
      center: mapCenter,
      mapId: "4504f8b37365c3d0",
    });

    const markers = [];

    // --- Add city markers ---
    for (const c of cities) {
      const cityMarker = new AdvancedMarkerElement({
        map,
        position: { lat: c.lat, lng: c.lng },
        title: c.title,
      });
      markers.push({ city: cityMarker, miniZoom: 10 });
    }

    // --- Add flight path ---
    if (cities.length > 1) {
      const flightPath = new google.maps.Polyline({
        geodesic: true,
        path: cities.map((c) => ({ lat: c.lat, lng: c.lng })),
        strokeColor: "#ea67e8",
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      flightPath.setMap(map);
    }

    // --- Zoom logic for cities ---
    map.addListener("zoom_changed", () => {
      const zoom = map.getZoom();
      for (const { city, miniZoom } of markers) {
        if (city) city.setMap(zoom > miniZoom ? map : null);
      }
    });

    // --- Intersection observer for marker animation ---
    const intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("drop");
            observer.unobserve(entry.target);
          }
        }
      },
    );

    // --- Create markers once map is idle ---
    google.maps.event.addListenerOnce(map, "idle", () => {
      for (const property of properties) {
        createMarker(map, AdvancedMarkerElement, property, PinElement);
      }
    });

    // --- Marker creation function with animation ---
    function createMarker(map, AdvancedMarkerElement, property, PinElement) {
      const pinElement = new PinElement();
      const content = pinElement.element;

      // Create the marker
      new AdvancedMarkerElement({
        position: {
          lat: property.lat ?? property.position?.lat ?? 0,
          lng: property.lng ?? property.position?.lng ?? 0,
        },
        map,
        title: property.description || "",
        content,
      });

      // Random delay time for staggered animation
      const time = 2 + Math.random();
      content.style.setProperty("--delay-time", `${time}s`);

      // Fallback animation trigger (works even if observer fails)
      setTimeout(() => content.classList.add("drop"), time * 300);

      // Listen for animation completion
      content.addEventListener("animationend", () => {
        content.classList.remove("drop");
        content.style.opacity = "1";
      });

      intersectionObserver.observe(content);
    }

    // --- Highlight toggle ---
    function toggleHighlight(markerView) {
      if (markerView.content.classList.contains("highlight")) {
        markerView.content.classList.remove("highlight");
        markerView.zIndex = null;
      } else {
        markerView.content.classList.add("highlight");
        markerView.zIndex = 1;
      }
    }

    // --- Property markers with custom content ---
    for (const property of properties) {
      const customMarker = new AdvancedMarkerElement({
        map,
        content: buildContent(property),
        position: {
          lat: property.lat ?? property.position?.lat ?? 0,
          lng: property.lng ?? property.position?.lng ?? 0,
        },
        title: property.description,
      });

      markers.push({ city: customMarker, miniZoom: 10 });

      customMarker.addEventListener("click", () => {
        toggleHighlight(customMarker);
      });
    }

    // --- Search bar logic ---
    const input = document.getElementById("search-box");
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const searchText = input.value.trim().toLowerCase();
        const match = cities.find(
          (place) => place.title.toLowerCase() === searchText,
        );
        if (match) {
          map.setCenter({ lat: match.lat, lng: match.lng });
          map.setZoom(10);
        }
      }
    });

    // --- Geolocation (optional) ---
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("Current user position:", userPos);
      });
    }
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}
