import L from 'leaflet';

const ACCENT = '#ef233c';
const MARKER_COLORS = { special: ACCENT, important: '#d90429' };

// Quadratic Bézier from a to b, bowed sideways so a route reads as an arc.
const arc = ([lat1, lng1], [lat2, lng2]) => {
  const cLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.2;
  const cLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.2;
  return Array.from({ length: 33 }, (_, i) => {
    const t = i / 32, u = 1 - t;
    return [u * u * lat1 + 2 * u * t * cLat + t * t * lat2, u * u * lng1 + 2 * u * t * cLng + t * t * lng2];
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const mainElement = document.querySelector('main');
  const itineraryElement = document.getElementById('itinerary');
  const drawer = document.querySelector('.drawer');
  const items = []; // { checkpoint, element, day, layer }

  fetch('../assets/data/trips/east_asia.json')
    .then(response => response.json())
    .then(data => {
      data.days.forEach((day, dayIndex) => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');

        const dayHeaderElement = document.createElement('h2');
        dayHeaderElement.classList.add('day-header');
        dayHeaderElement.innerText = day.day;

        dayElement.appendChild(dayHeaderElement);

        const dayContentElement = document.createElement('div');
        dayContentElement.classList.add('day-content');

        day.checkpoints.forEach(checkpoint => {
          let checkpointElement;
          if (checkpoint.link) {
            checkpointElement = document.createElement('a');
            checkpointElement.href = checkpoint.link;
            checkpointElement.target = '_blank';
          } else {
            checkpointElement = document.createElement('div');
          }
          checkpointElement.classList.add('day-content-checkpoint');
          if (checkpoint.class) {
            checkpointElement.classList.add(checkpoint.class);
          }

          let infosContent = '';
          if (checkpoint.infos) {
            checkpoint.infos.forEach(info => {
              infosContent += `
              <div class="day-content-checkpoint-info-infos-item">
              ${info.icon ? `<i class="fa-solid ${info.icon}"></i>` : ''} ${info.text}
              </div>
              `;
            });
          }

          const checkpointContent = `
          <div class="day-content-checkpoint-timeline">
            <div class="day-content-checkpoint-timeline-time">${checkpoint.time}</div>
              <div class="day-content-checkpoint-timeline-line"></div>
            </div>
            <div class="day-content-checkpoint-info">
              <div class="day-content-checkpoint-info-title">
                ${checkpoint.icon ? `<i class="fa-solid ${checkpoint.icon}"></i>` : ''} ${checkpoint.title}
              </div>
              ${checkpoint.description ? `<div class="day-content-checkpoint-info-description">${checkpoint.description}</div>` : ''}
              ${infosContent ? `<div class="day-content-checkpoint-info-infos">${infosContent}</div>` : ''}
          </div>
          `;

          checkpointElement.innerHTML = checkpointContent;
          dayContentElement.appendChild(checkpointElement);
          items.push({ checkpoint, element: checkpointElement, day: dayIndex });
        });

        dayElement.appendChild(dayContentElement);
        itineraryElement.appendChild(dayElement);

        // Add event listener to toggle visibility with sliding effect
        dayHeaderElement.addEventListener('click', () => {
          const expanded = dayContentElement.classList.toggle('expanded');
          if (expanded && isMapView()) fitDay(dayIndex);
        });
      });

      showView();
      window.addEventListener('hashchange', showView);
    })
    .catch(error => console.error('Error loading itinerary:', error));

  // Map view (#map): Leaflet map, itinerary in a bottom drawer.
  // Checkpoints with `coords` become dots, ones with `route` become arcs.
  let map;
  let selected;
  let snap = 1;
  const snapHeights = () => [88, innerHeight * 0.5, innerHeight - 72]; // peek, half, full
  const isMapView = () => location.hash === '#map';

  const setSnap = index => {
    snap = index;
    drawer.style.height = `${snapHeights()[index]}px`;
  };

  // Keeps fitted features clear of the List button and the drawer.
  const padding = () => ({ paddingTopLeft: [24, 72], paddingBottomRight: [24, snapHeights()[snap] + 24], maxZoom: 15 });
  const flyTo = layers => map.flyToBounds(L.featureGroup(layers).getBounds(), padding());

  const fitDay = day => {
    const layers = items.filter(item => item.day === day && item.layer).map(item => item.layer);
    if (layers.length) flyTo(layers);
  };

  const highlight = (item, on) => {
    if (item.checkpoint.route) item.layer.setStyle({ weight: on ? 6 : 3 });
    else item.layer.setRadius(on ? 10 : 6);
    item.element.classList.toggle('selected', on);
  };

  // clickLatLng is set when the selection comes from the map.
  const select = (item, clickLatLng) => {
    if (selected) highlight(selected, false);
    selected = item;
    highlight(item, true);
    item.layer.bringToFront();
    item.element.closest('.day-content').classList.add('expanded');

    if (clickLatLng) {
      if (snap === 0) setSnap(1);
      map.panInside(clickLatLng, padding());
    } else {
      if (snap === 2) setSnap(1);
      map.once('moveend', () => item.layer.openPopup());
      flyTo([item.layer]);
    }
    // after the drawer and day-expand transitions have made room
    setTimeout(() => item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 500);
  };

  const initMap = () => {
    map = L.map('map', { zoomControl: false, attributionControl: false, renderer: L.canvas({ tolerance: 8 }) });
    L.control.attribution({ position: 'topright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // German OSM style: free for non-commercial sites, labels Thai/Lao names in Latin script too
    L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    items.forEach(item => {
      const { checkpoint } = item;
      if (checkpoint.route) {
        item.layer = L.polyline(arc(...checkpoint.route), {
          color: ACCENT,
          weight: 3,
          dashArray: checkpoint.class === 'travel' ? '6 8' : null,
        });
      } else if (checkpoint.coords) {
        item.layer = L.circleMarker(checkpoint.coords, {
          radius: 6,
          color: '#fff',
          weight: 2,
          fillColor: MARKER_COLORS[checkpoint.class] || '#2b2d42',
          fillOpacity: 1,
        });
      } else {
        return;
      }
      item.element.classList.add('on-map');
      item.layer
        .bindPopup(`<b>${checkpoint.time}</b> ${checkpoint.title}${checkpoint.link ? `<br><a href="${checkpoint.link}" target="_blank">Open ↗</a>` : ''}`, { autoPan: false })
        .on('click', event => select(item, event.latlng))
        .addTo(map);
    });

    map.fitBounds(L.featureGroup(items.filter(item => item.layer).map(item => item.layer)).getBounds(), padding());
  };

  const showView = () => {
    const mapView = isMapView();
    document.body.classList.toggle('map-mode', mapView);
    (mapView ? drawer.querySelector('.drawer-body') : mainElement).appendChild(itineraryElement);
    if (!mapView) return;
    setSnap(snap);
    if (map) map.invalidateSize();
    else initMap();
  };

  // In map view a tap on a checkpoint shows it on the map; its link moves into the popup.
  itineraryElement.addEventListener('click', event => {
    if (!isMapView()) return;
    const item = items.find(i => i.layer && i.element.contains(event.target));
    if (!item) return;
    event.preventDefault();
    select(item);
  });

  window.addEventListener('resize', () => isMapView() && setSnap(snap));

  // Drawer, like shadcn's (vaul): drag the handle between snap points, tap or Enter toggles peek/half.
  const handle = drawer.querySelector('.drawer-handle');
  let drag = null;
  let dragged = false;

  handle.addEventListener('pointerdown', event => {
    handle.setPointerCapture(event.pointerId);
    dragged = false;
    drag = { startY: event.clientY, startHeight: drawer.offsetHeight, y: event.clientY, time: event.timeStamp, velocity: 0 };
    drawer.classList.add('dragging');
  });

  handle.addEventListener('pointermove', event => {
    if (!drag) return;
    drag.velocity = (drag.y - event.clientY) / Math.max(1, event.timeStamp - drag.time); // px/ms, positive = up
    drag.y = event.clientY;
    drag.time = event.timeStamp;
    const [min, , max] = snapHeights();
    drawer.style.height = `${Math.min(max, Math.max(min, drag.startHeight + drag.startY - event.clientY))}px`;
  });

  const endDrag = event => {
    if (!drag) return;
    drawer.classList.remove('dragging');
    dragged = Math.abs(drag.y - drag.startY) > 4;
    if (dragged) {
      // a flick carries on past the release point; a slow release snaps to the nearest height
      const velocity = event.timeStamp - drag.time < 100 ? drag.velocity : 0;
      const target = drawer.offsetHeight + velocity * 200;
      const heights = snapHeights();
      setSnap(heights.reduce((best, h, i) => (Math.abs(h - target) < Math.abs(heights[best] - target) ? i : best), 0));
    }
    drag = null;
  };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);

  handle.addEventListener('click', () => {
    if (!dragged) setSnap(snap === 0 ? 1 : 0);
    dragged = false;
  });

  // Countdown Timer
//   const tripStartDate = new Date('2024-07-17T08:45:00'); // Set your trip start date here
//   const headerElement = document.querySelector('.header'); // Assuming header class is used
//
//   const countdownElement = document.createElement('div');
//   countdownElement.classList.add('countdown-timer');
//   headerElement.appendChild(countdownElement);
//
//   function updateCountdown() {
//     const now = new Date();
//     const timeRemaining = tripStartDate - now;
//
//     if (timeRemaining > 0) {
//       const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//       const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
//
//       countdownElement.innerHTML = `
// <div>Trip starts in ${days} days ${hours} hours ${minutes} minutes ${seconds} seconds</div>
// `;
//     } else {
//       clearInterval(countdownInterval);
//       countdownElement.innerHTML = 'Trip started!';
//     }
//   }

  // const countdownInterval = setInterval(updateCountdown, 1000);
  // updateCountdown(); // Initial call to display the countdown immediately

});
