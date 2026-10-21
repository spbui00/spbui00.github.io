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

  const PLAN = '../assets/data/trips/east_asia.json';
  const STORAGE_KEY = `trip:${PLAN}`;
  // { [dayIndex]: { start: 'HH:MM', order: [titles of the items in that day's timeline] } }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch {}
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch {} };

  const toMinutes = time => +time.slice(0, 2) * 60 + +time.slice(3);
  const toTime = minutes => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const formatDuration = minutes => [Math.floor(minutes / 60) && `${Math.floor(minutes / 60)}h`, minutes % 60 && `${minutes % 60}m`].filter(Boolean).join(' ');

  const days = []; // { start: input, timeline, options, items, date }

  // 'Saturday, 5th December 2026 - …' → '12/05/26' (Google Maps' format); the undated extra days get null
  const mapsDate = title => {
    const [, day, month, year] = title.match(/(\d+)(?:st|nd|rd|th) (\w+) (\d{4})/) ?? [];
    if (!day) return null;
    return `${String(new Date(`${month} 1, 2000`).getMonth() + 1).padStart(2, '0')}/${day.padStart(2, '0')}/${year.slice(2)}`;
  };

  const renderCheckpoint = checkpoint => {
    let checkpointElement;
    if (checkpoint.link) {
      checkpointElement = document.createElement('a');
      checkpointElement.href = checkpoint.link;
      checkpointElement.target = '_blank';
      checkpointElement.draggable = false;
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

    checkpointElement.innerHTML = `
    <div class="day-content-checkpoint-timeline">
      <div class="day-content-checkpoint-timeline-time"></div>
      <div class="day-content-checkpoint-timeline-duration">${formatDuration(checkpoint.duration)}</div>
      <div class="day-content-checkpoint-timeline-line"></div>
    </div>
    <div class="day-content-checkpoint-info">
      <div class="day-content-checkpoint-info-title">
        ${checkpoint.icon ? `<i class="fa-solid ${checkpoint.icon}"></i>` : ''} ${checkpoint.title}
        <span class="day-content-checkpoint-actions">
          ${checkpoint.optional ? '<button class="unpin" aria-label="Remove from the day"><i class="fa-solid fa-xmark"></i></button>' : ''}
          <button class="drag" aria-label="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
        </span>
      </div>
      ${checkpoint.description ? `<div class="day-content-checkpoint-info-description">${checkpoint.description}</div>` : ''}
      ${infosContent ? `<div class="day-content-checkpoint-info-infos">${infosContent}</div>` : ''}
    </div>
    `;
    return checkpointElement;
  };

  // Times flow from the day's start through each item's duration. Pinned items (with `time`) keep their
  // time: the gap before them is free time, and they turn red when the items before run past it.
  const retime = dayIndex => {
    const day = days[dayIndex];
    let clock = toMinutes(day.start.value);
    [...day.timeline.children].forEach((element, position) => {
      const item = items.find(i => i.element === element);
      const pinned = item.checkpoint.time;
      const late = pinned && position > 0 && clock > toMinutes(pinned);
      if (pinned) clock = toMinutes(pinned);
      item.time = toTime(clock);
      const timeElement = element.querySelector('.day-content-checkpoint-timeline-time');
      timeElement.textContent = item.time;
      timeElement.classList.toggle('pinned', !!pinned);
      timeElement.classList.toggle('late', !!late);
      timeElement.title = late ? 'The plans before this run late' : '';
      clock += item.checkpoint.duration;
    });
  };

  // Puts the day's picked items in the timeline (in their saved order) and the rest in the options row.
  const layout = dayIndex => {
    const day = days[dayIndex];
    const byTitle = title => day.items.find(item => item.checkpoint.title === title);
    const order = saved[dayIndex]?.order.map(byTitle).filter(Boolean)
      ?? day.items.filter(item => !item.checkpoint.optional);
    // ponytail: must-dos added to the JSON after a save go to the end of the day; drag them into place
    day.items.forEach(item => !item.checkpoint.optional && !order.includes(item) && order.push(item));
    day.start.value = saved[dayIndex]?.start ?? day.defaultStart;

    day.items.forEach(item => {
      item.picked = order.includes(item);
      if (!item.picked) day.options.appendChild(item.element);
      if (map && item.layer) item.picked ? item.layer.addTo(map) : item.layer.remove();
    });
    order.forEach(item => day.timeline.appendChild(item.element));
    day.options.parentElement.hidden = !day.options.children.length;
    retime(dayIndex);
  };

  const store = dayIndex => {
    const day = days[dayIndex];
    saved[dayIndex] = {
      start: day.start.value,
      order: [...day.timeline.children].map(element => items.find(i => i.element === element).checkpoint.title),
    };
    save();
    layout(dayIndex);
  };

  fetch(PLAN)
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
        dayContentElement.innerHTML = `
        <div class="day-start">
          <label>Day starts <input type="time" required></label>
          <button class="day-reset">Reset day</button>
        </div>
        <div class="day-timeline"></div>
        <div class="day-options">
          <div class="day-options-label">Optional, tap to add</div>
          <div class="day-options-list"></div>
        </div>
        `;

        const dayState = {
          start: dayContentElement.querySelector('.day-start input'),
          defaultStart: day.start,
          timeline: dayContentElement.querySelector('.day-timeline'),
          options: dayContentElement.querySelector('.day-options-list'),
          items: [],
          date: mapsDate(day.day),
        };
        days.push(dayState);

        day.checkpoints.forEach(checkpoint => {
          const item = { checkpoint, element: renderCheckpoint(checkpoint), day: dayIndex };
          items.push(item);
          dayState.items.push(item);
        });

        dayState.start.addEventListener('change', () => dayState.start.value && store(dayIndex));
        dayContentElement.querySelector('.day-reset').addEventListener('click', () => {
          delete saved[dayIndex];
          save();
          layout(dayIndex);
        });

        dayElement.appendChild(dayContentElement);
        itineraryElement.appendChild(dayElement);
        layout(dayIndex);

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

  // Right-click (long-press on a phone) on an item: Google Maps directions to it.
  const menu = document.createElement('div');
  menu.classList.add('context-menu');
  menu.hidden = true;
  document.body.appendChild(menu);
  const closeMenu = () => { menu.hidden = true; };

  const place = ({ checkpoint }) => checkpoint.coords ?? checkpoint.route?.[1]; // a route leads to its end
  const mapsTime = minutes => `${(Math.floor(minutes / 60) % 12) || 12}:${String(minutes % 60).padStart(2, '0')}${minutes % 1440 < 720 ? 'am' : 'pm'}`;

  const openMenu = (item, x, y) => {
    const destination = place(item);
    if (!destination) return;
    const day = days[item.day];
    // ponytail: the documented URL (api=1) can't take a departure time; the legacy saddr/daddr one can
    // (only used for transit, which both links default to). Swap to api=1 if Google drops the old parameters.
    const links = [
      ['fa-map-location-dot', 'Show on maps', `https://www.google.com/maps/search/?api=1&query=${destination}`],
      ['fa-location-crosshairs', 'From here', `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`],
    ];
    const timeline = [...day.timeline.children];
    const before = item.picked ? timeline.slice(0, timeline.indexOf(item.element)).map(e => items.find(i => i.element === e)) : [];
    const from = before.reverse().find(place);
    if (from) {
      const previous = before[0];
      const leave = toMinutes(previous.time) + previous.checkpoint.duration;
      const time = day.date ? `&ttype=dep&date=${day.date}&time=${mapsTime(leave)}` : '';
      links.push(['fa-route', `From ${from.checkpoint.title}`, `https://maps.google.com/maps?saddr=${place(from)}&daddr=${destination}&dirflg=r${time}`]);
    }
    menu.innerHTML = links.map(([icon, text, href]) => `<a href="${href}" target="_blank" rel="noopener"><i class="fa-solid ${icon}"></i> ${text}</a>`).join('');
    menu.hidden = false;
    menu.style.left = `${Math.min(x, innerWidth - menu.offsetWidth - 8)}px`;
    menu.style.top = `${Math.min(y, innerHeight - menu.offsetHeight - 8)}px`;
  };

  let press = null; // long-press timer on touch, since iOS Safari never fires contextmenu
  let suppressClick = false;
  itineraryElement.addEventListener('contextmenu', event => {
    const item = items.find(i => i.element.contains(event.target));
    if (!item || !place(item)) return;
    event.preventDefault();
    openMenu(item, event.clientX, event.clientY);
  });
  itineraryElement.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.target.closest('.drag, .unpin')) return;
    const item = items.find(i => i.element.contains(event.target));
    if (!item) return;
    press = { x: event.clientX, y: event.clientY, timer: setTimeout(() => { suppressClick = true; openMenu(item, press.x, press.y); }, 500) };
  });
  const cancelPress = event => {
    if (!press || (event.type === 'pointermove' && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 10)) return;
    clearTimeout(press.timer);
    press = null;
  };
  ['pointermove', 'pointerup', 'pointercancel'].forEach(type => itineraryElement.addEventListener(type, cancelPress));
  // the tap that ends a long press shouldn't also open the link or add the option
  itineraryElement.addEventListener('click', event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener('pointerdown', event => !menu.contains(event.target) && closeMenu());
  menu.addEventListener('click', closeMenu);
  addEventListener('keydown', event => event.key === 'Escape' && closeMenu());
  addEventListener('scroll', closeMenu, true);

  itineraryElement.addEventListener('click', event => {
    const item = items.find(i => i.element.contains(event.target));
    if (!item) return;
    const day = days[item.day];
    if (event.target.closest('.drag')) {
      event.preventDefault();
    } else if (event.target.closest('.unpin')) {
      event.preventDefault();
      item.element.remove();
      store(item.day);
    } else if (!item.picked) {
      event.preventDefault();
      const next = day.items.slice(day.items.indexOf(item) + 1).find(i => i.picked);
      day.timeline.insertBefore(item.element, next?.element ?? null);
      store(item.day);
    } else {
      return;
    }
    event.stopImmediatePropagation();
  });

  // Drag the grip to reorder a day: the item follows the pointer and the others slide out of its way.
  // Pointer events rather than HTML drag and drop, which doesn't work on touch.
  let reorder = null; // { item, grabY, pointerY, dy, frame }
  const translate = (element, dy) => { element.style.transform = dy ? `translateY(${dy}px)` : ''; };

  const followPointer = () => {
    const { item: { element, day }, grabY, pointerY } = reorder;
    const timeline = days[day].timeline;
    // offsetTop ignores transforms, so siblings mid-slide don't make the target jump around
    const origin = element.getBoundingClientRect().top - reorder.dy - element.offsetTop;
    const center = pointerY - grabY + element.offsetHeight / 2 - origin;
    const siblings = [...timeline.children].filter(child => child !== element);
    const before = siblings.find(child => center < child.offsetTop + child.offsetHeight / 2);

    if (before !== element.nextElementSibling) {
      const oldTops = siblings.map(child => child.offsetTop);
      timeline.insertBefore(element, before ?? null);
      // FLIP: start each moved sibling where it was, then let it slide to its new place
      siblings.forEach((child, i) => {
        const shift = oldTops[i] - child.offsetTop;
        if (!shift) return;
        child.style.transition = 'none';
        translate(child, shift);
        child.offsetTop; // flush the style before animating
        child.style.transition = 'transform 0.2s ease';
        translate(child, 0);
      });
      retime(day);
    }
    reorder.dy = pointerY - grabY - (origin + element.offsetTop);
    translate(element, reorder.dy);
  };

  // Scrolls while the pointer is held near the top or bottom edge.
  const autoScroll = () => {
    const { pointerY } = reorder;
    const speed = pointerY < 80 ? -(80 - pointerY) / 4 : pointerY > innerHeight - 80 ? (pointerY - innerHeight + 80) / 4 : 0;
    if (speed) {
      (isMapView() ? drawer.querySelector('.drawer-body') : document.scrollingElement).scrollBy(0, speed);
      followPointer();
    }
    reorder.frame = requestAnimationFrame(autoScroll);
  };

  itineraryElement.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.drag');
    if (!handle) return;
    const item = items.find(i => i.element.contains(handle));
    if (!item.picked) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    reorder = { item, grabY: event.clientY - item.element.getBoundingClientRect().top, pointerY: event.clientY, dy: 0 };
    item.element.classList.add('reordering');
    reorder.frame = requestAnimationFrame(autoScroll);
  });

  itineraryElement.addEventListener('pointermove', event => {
    if (!reorder) return;
    reorder.pointerY = event.clientY;
    followPointer();
  });

  const endReorder = () => {
    if (!reorder) return;
    const { item: { element, day }, frame } = reorder;
    cancelAnimationFrame(frame);
    reorder = null;
    // glide into the slot it was dropped on
    element.classList.remove('reordering');
    element.style.transition = 'transform 0.2s ease';
    translate(element, 0);
    element.addEventListener('transitionend', () => { element.style.transition = ''; }, { once: true });
    store(day);
  };
  itineraryElement.addEventListener('pointerup', endReorder);
  itineraryElement.addEventListener('pointercancel', endReorder);

  // Map view (#map): Leaflet map, itinerary in a bottom drawer.
  // Checkpoints with `coords` become dots, ones with `route` become arcs.
  let map;
  let selected;
  let snap = 1;
  const snapHeights = () => [88, innerHeight * 0.5, innerHeight - 72]; // peek, half, full
  const isMapView = () => location.hash === '#map';
  // wider screens get a side pane instead of the bottom drawer (CSS does the layout, so keep in sync with main.scss)
  const sidePane = matchMedia('(min-width: 769px)');

  const setSnap = index => {
    snap = index;
    drawer.style.height = sidePane.matches ? '' : `${snapHeights()[index]}px`;
  };

  // Keeps fitted features clear of the List button and the drawer.
  const padding = () => ({
    paddingTopLeft: [24, 72],
    paddingBottomRight: sidePane.matches ? [drawer.offsetWidth + 48, 24] : [24, snapHeights()[snap] + 24],
    maxZoom: 15,
  });
  const flyTo = layers => map.flyToBounds(L.featureGroup(layers).getBounds(), padding());

  const fitDay = day => {
    const layers = items.filter(item => item.day === day && item.picked && item.layer).map(item => item.layer);
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
        .bindPopup(() => `<b>${item.time}</b> ${checkpoint.title}${checkpoint.link ? `<br><a href="${checkpoint.link}" target="_blank">Open ↗</a>` : ''}`, { autoPan: false })
        .on('click', event => select(item, event.latlng));
      if (item.picked) item.layer.addTo(map);
    });

    map.fitBounds(L.featureGroup(items.filter(item => item.picked && item.layer).map(item => item.layer)).getBounds(), padding());
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
    const item = items.find(i => i.picked && i.layer && i.element.contains(event.target));
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
