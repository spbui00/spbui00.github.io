import { createElement } from './modules/utilities.js';

export function handleWork() {
  const projectsContainer = document.querySelector('#projects .items');

  fetch('../assets/data/projects.json')
    .then((response) => response.json())
    .then((data) => {
      const projects = data.projects;

      // TODO: add sorting and filtering

      projects.forEach((project) => {
        const projectItem = createElement('div', 'item', ['data-target', project.id]);
        const itemName = createElement('div', 'item-name');

        if (projects.icon) {
          addIcon(itemName, project.icon);  
        }
        
        itemName.innerHTML += project.name;
        projectItem.appendChild(itemName);

        const itemTags = createElement('div', 'item-tags');
        project.tags.sort().forEach((tag) => {
          const itemTag = createElement('span', 'item-tag');
          itemTag.innerHTML = tag;
          itemTags.appendChild(itemTag);
        });
        projectItem.appendChild(itemTags);

        const itemDescription = createElement('div', 'item-description');
        itemDescription.innerHTML = project.description;
        projectItem.appendChild(itemDescription);

        projectItem.addEventListener('click', () => {
          const popup = document.getElementById(project.id);
          popup.style.display = 'flex';
        });

        projectsContainer.appendChild(projectItem); 

        // create popups
        const popup = createElement('div', 'popup', project.id);
        
        const popupContainer = createElement('div', 'popup-container');
        
        // NAME OF PROJECT
        const popupName = document.createElement('h1');
        popupName.innerHTML = project.name;
        if (projects.icon) {
          addIcon(popupName, project.icon);        
        }
        popupContainer.appendChild(popupName);

        // tags
        popupContainer.appendChild(itemTags.cloneNode(true));

        const popupChildren = createElement('div', 'popup-children');

        // left child 
        const popupLeft = createElement('div', 'popup-children-left');

        // links
        const popupLinks = createElement('div', 'popup-links');
        popupLinks.innerHTML = '<h2>Links for details</h2>';
        if (!project.links && !project.report) {
          popupLinks.innerHTML += '<div>No available links. (Might be due to copyright)</div>';
        }
        project.link.forEach((link) => {
          const popupLink = createElement('a', null, null, [
            ['href', link.url], 
            ['target', '_blank']
            ]);
          popupLink.innerHTML = link.name;
          popupLinks.appendChild(popupLink);
        });

        if (project.report) {
          const popupReport = createElement('a', null, null, [
            ['href', project.report],
            ['target', '_blank']
            ]);
          popupReport.innerHTML = 'Report';
          popupLinks.appendChild(popupReport);
        }

        popupLeft.appendChild(popupLinks);

        // description 
        const popupDescription = createElement('div', 'popup-details');
        popupDescription.innerHTML = project.longDescription;
        popupLeft.appendChild(popupDescription);

        // TODO: images
        // const popupImages = createElement('div', 'images');
        //
        // const popupImagesButtons = createElement('div', 'buttons');
        // const popupImagesButtonLeft = createElement('button');
        // popupImagesButtonLeft.innerHTML = '<i class="fa-solid fa-circle-caret-left"></i>';
        // const popupImagesButtonRight = createElement('button');
        // popupImagesButtonRight.innerHTML = '<i class="fa-solid fa-circle-caret-right"></i>';
        // popupImagesButtons.appendChild(popupImagesButtonLeft);
        // popupImagesButtons.appendChild(popupImagesButtonRight);
        // popupImages.appendChild(popupImagesButtons);
        // 
        // if (project.images) {
        //   const popupImagesContainer = createElement('div', 'image-container');
        //   fetch(`../images/projects/${project.images}/*`)
        //     .then((response) => response.text())
        //     .then((data) => {
        //       data.images.forEach((image) => {
        //         const popupImage = createElement('img', 'image', null, [
        //           ['src', `../images/${project.id}/${image}`],
        //           ['alt', `${project.name} image`],
        //           ['loading', 'lazy'],
        //           ['title', `${image}`]
        //           ]);
        //         popupImagesContainer.appendChild(popupImage);
        //       });
        //     });
        // }
        
        popupChildren.appendChild(popupLeft);
        
        // right child
        const popupRight = createElement('div', 'popup-children-right');
        popupRight.innerHTML = '<h2>Personal take</h2>';
        const popupTake = createElement('div');
        popupTake.innerHTML = project.personalTake;
        popupRight.appendChild(popupTake);
        popupChildren.appendChild(popupRight);
        
        popupContainer.appendChild(popupChildren);
        popup.appendChild(popupContainer);

        popup.addEventListener('click', (e) => {
          if (e.target.classList.contains('popup')) {
            popup.style.display = 'none';
          } 
        });

        document.querySelector('.work').appendChild(popup);
      });
    });

  // business links 
  const businessLinks = document.querySelectorAll('#business .item');
  businessLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const url = link.getAttribute('url');
      window.open(url, '_blank');
    });
  });

  // fetch reviews 
  const reviewsContainer = document.querySelector('#ratings .items');
  fetch('../assets/data/ratings.json')
    .then((response) => response.json())
    .then((data) => {
      const reviews = data.ratings;
      reviews.forEach((review) => {
        const reviewItem = createElement('div', 'item');
        reviewItem.classList.add('rating');
        const reviewHeading = createElement('div', 'heading');
        const reviewName = createElement('div', 'heading-name');
        const reviewOrigin = createElement('div', 'heading-origin');
        reviewName.innerHTML = review.name;
        reviewOrigin.innerHTML = review.origin;
        reviewHeading.appendChild(reviewName);
        reviewHeading.appendChild(reviewOrigin);
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

function addIcon(el, icon) {
  const itemIcon = document.createElement('div');
  itemIcon.classList.add('item-icon');
  fetch(`../assets/icons/${icon}.svg`)
    .then((response) => response.text())
    .then((svg) => {
      itemIcon.innerHTML = svg;
      el.appendChild(itemIcon);
    })
    .catch((error) => {
      console.error(error);
    });
}
