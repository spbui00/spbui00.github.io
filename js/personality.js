import { createElement } from "./modules/utilities.js";

export function handlePersonality() {
  // fetch friends reviews 
  const reviewsContainer = document.querySelector('#ratings .items');
  fetch('../assets/data/friends.json')
    .then((response) => response.json())
    .then((data) => {
      const reviews = data.ratings;
      reviews.forEach((review) => {
        const reviewItem = createElement('div', 'item');
        reviewItem.classList.add('rating');
        const reviewHeading = createElement('div', 'heading');
        const reviewName = createElement('div', 'heading-name');
        reviewName.innerHTML = review.name;
        reviewHeading.appendChild(reviewName);
        reviewItem.appendChild(reviewHeading);

        const reviewContainer = createElement('div', 'review');
        const reviewText = createElement('div', 'review-text'); 
        reviewText.innerHTML = review.review;
        reviewContainer.appendChild(reviewText);
        reviewItem.appendChild(reviewContainer);

        const reviewDate = createElement('div', 'date');
        reviewDate.innerHTML = review.date;
        reviewItem.appendChild(reviewDate);

        reviewsContainer.appendChild(reviewItem);
      });
    });

}
