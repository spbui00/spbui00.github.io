document.addEventListener('DOMContentLoaded', () => {
  fetch('../assets/data/trip.json')
    .then(response => response.json())
    .then(data => {
      const mainElement = document.querySelector('main');
      const headerElement = document.createElement('div');
      headerElement.classList.add('header');
      headerElement.innerHTML = `<h1>${data.title}</h1>`;
      mainElement.appendChild(headerElement);

      data.days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.innerHTML = `<h2>${day.day}</h2>`;

        const dayContentElement = document.createElement('div');
        dayContentElement.classList.add('day-content');

        day.checkpoints.forEach(checkpoint => {
          const checkpointElement = document.createElement('div');
          checkpointElement.classList.add('day-content-checkpoint');
          if (checkpoint.class) {
            checkpointElement.classList.add(checkpoint.class);
          }

          checkpointElement.innerHTML = `
            <div class="day-content-checkpoint-timeline">
              <div class="day-content-checkpoint-timeline-time">${checkpoint.time}</div>
              <div class="day-content-checkpoint-timeline-line"></div>
            </div>
            <div class="day-content-checkpoint-info">
              <div class="day-content-checkpoint-info-title">
                ${checkpoint.icon ? `<i class="fa-solid ${checkpoint.icon}"></i>` : ''} ${checkpoint.title}
              </div>
              <div class="day-content-checkpoint-info-description">${checkpoint.description}</div>
            </div>
          `;

          dayContentElement.appendChild(checkpointElement);
        });

        dayElement.appendChild(dayContentElement);
        mainElement.appendChild(dayElement);
      });
    })
    .catch(error => console.error('Error loading itinerary:', error));
});
