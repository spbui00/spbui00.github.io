document.addEventListener('DOMContentLoaded', () => {
  fetch('../assets/data/trips/vietnam.json')
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
  const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=Danang&aqi=no`;

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
