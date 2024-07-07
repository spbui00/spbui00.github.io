document.addEventListener('DOMContentLoaded', () => {
  fetch('../assets/data/trip.json')
    .then(response => response.json())
    .then(data => {
      const mainElement = document.querySelector('main');

      data.days.forEach(day => {
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

          const checkpointContent = `
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

          checkpointElement.innerHTML = checkpointContent;
          dayContentElement.appendChild(checkpointElement);
        });

        dayElement.appendChild(dayContentElement);
        mainElement.appendChild(dayElement);

        // Add event listener to toggle visibility with sliding effect
        dayHeaderElement.addEventListener('click', () => {
          dayContentElement.classList.toggle('expanded');
        });
      });

    })
    .catch(error => console.error('Error loading itinerary:', error));

  // Fetch weather data
  const weatherApiKey = process.env.WEATHERAPI_KEY;
  const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=Pompei&aqi=no`;

  fetch(weatherUrl)
    .then(response => response.json())
    .then(weatherData => {
      const weatherInfo = document.getElementById('weather-info');
      weatherInfo.innerHTML = `
      <div class="weather-item"><i class="fas fa-thermometer-half"></i> ${weatherData.current.temp_c} °C</div>
      <div class="weather-item"><i class="fas fa-cloud"></i> ${weatherData.current.condition.text}</div>
      <div class="weather-item"><i class="fas fa-tint"></i> ${weatherData.current.humidity}%</div>
      <div class="weather-item"><i class="fas fa-wind"></i> ${weatherData.current.wind_kph} kph</div>
      `;
    })
    .catch(error => console.error('Error fetching weather data:', error));
});
