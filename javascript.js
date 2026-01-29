let markers = [];

async function initMap() {
  try {
    const response = await fetch("./db.json");
    const data = await response.json();
    const cities = data.cities || [];
    const properties = data.properties || [];
    const { AdvancedMarkerElement, PinElement } =
      await google.maps.importLibrary("marker");

    let mapCenter;
    if (cities?.length) {
      mapCenter = { lat: cities[0].lat, lng: cities[0].lng };
    } else if (properties?.length) {
      mapCenter = { lat: properties[0].lat, lng: properties[0].lng };
    }

    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 6,
      center: mapCenter,
      mapId: "4504f8b37365c3d0",
    });

    cities.forEach((loc) => {
      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: loc.lat, lng: loc.lng },
        title: loc.title,
      });
      markers.push(marker);
    });

    for (const property of properties) {
      const advancedMarkerElement = new AdvancedMarkerElement({
        map,
        content: buildContent(property),
        position: property.position,
        title: property.description,
      });

      advancedMarkerElement.addEventListener("click", () => {
        toggleHighlight(advancedMarkerElement, property);
      });
    }

    function toggleHighlight(markerView, property) {
      if (markerView.content.classList.contains("highlight")) {
        markerView.content.classList.remove("highlight");
        markerView.zIndex = null;
      } else {
        markerView.content.classList.add("highlight");
        markerView.zIndex = 1;
      }
    }

    function buildContent(property) {
      const content = document.createElement("div");
      content.classList.add("property");

      content.innerHTML = `<div class="icon">
        <i aria-hidden="true" class="fa fa-icon fa-${property.type}" title="${property.type}"></i>
        <span class="fa-sr-only">${property.type}</span>
    </div>
    <div class="details">
        <div class="price">${property.price}</div>
        <div class="address">${property.address}</div>
        <div class="features">
        <div>
            <i aria-hidden="true" class="fa fa-bed fa-lg bed" title="bedroom"></i>
            <span class="fa-sr-only">bedroom</span>
            <span>${property.bed}</span>
        </div>
        <div>
            <i aria-hidden="true" class="fa fa-bath fa-lg bath" title="bathroom"></i>
            <span class="fa-sr-only">bathroom</span>
            <span>${property.bath}</span>
        </div>
        <div>
            <i aria-hidden="true" class="fa fa-ruler fa-lg size" title="size"></i>
            <span class="fa-sr-only">size</span>
            <span>${property.size} ft<sup>2</sup></span>
        </div>
        </div>
    </div>`;
      return content;
    }

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
        } else {
          console.warn("No location found for:", searchText);
        }
      }
    });

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
