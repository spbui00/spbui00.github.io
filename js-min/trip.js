document.addEventListener("DOMContentLoaded",()=>{fetch("../assets/data/trips/dolomites.json").then(e=>e.json()).then(e=>{const c=document.querySelector("main");e.days.forEach(e=>{var t=document.createElement("div"),i=(t.classList.add("day"),document.createElement("h2"));i.classList.add("day-header"),i.innerText=e.day,t.appendChild(i);const n=document.createElement("div");n.classList.add("day-content"),e.checkpoints.forEach(e=>{let t,i=(e.link?((t=document.createElement("a")).href=e.link,t.target="_blank"):t=document.createElement("div"),t.classList.add("day-content-checkpoint"),e.class&&t.classList.add(e.class),"");e.infos&&e.infos.forEach(e=>{i+=`
              <div class="day-content-checkpoint-info-infos-item">
              ${e.icon?`<i class="fa-solid ${e.icon}"></i>`:""} ${e.text}
              </div>
              `});e=`
          <div class="day-content-checkpoint-timeline">
            <div class="day-content-checkpoint-timeline-time">${e.time}</div>
              <div class="day-content-checkpoint-timeline-line"></div>
            </div>
            <div class="day-content-checkpoint-info">
              <div class="day-content-checkpoint-info-title">
                ${e.icon?`<i class="fa-solid ${e.icon}"></i>`:""} ${e.title}
              </div>
              ${e.description?`<div class="day-content-checkpoint-info-description">${e.description}</div>`:""}
              ${i?`<div class="day-content-checkpoint-info-infos">${i}</div>`:""}
          </div>
          `;t.innerHTML=e,n.appendChild(t)}),t.appendChild(n),c.appendChild(t),i.addEventListener("click",()=>{n.classList.toggle("expanded")})})}).catch(e=>console.error("Error loading itinerary:",e));var e=process.env.WEATHERAPI_KEY;fetch(`https://api.weatherapi.com/v1/current.json?key=${e}&q=Canazei&aqi=no`).then(e=>e.json()).then(e=>{document.getElementById("weather-info").innerHTML=`
<div class="weather-item"><i class="fas fa-thermometer-half"></i> ${e.current.temp_c} °C</div>
<div class="weather-item"><i class="fas fa-cloud"></i> ${e.current.condition.text}</div>
<div class="weather-item"><i class="fas fa-tint"></i> ${e.current.humidity}%</div>
<div class="weather-item"><i class="fas fa-wind"></i> ${e.current.wind_kph} kph</div>
`}).catch(e=>console.error("Error fetching weather data:",e))});