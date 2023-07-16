import { removeActives, fetchHTML } from './modules/utilities.js';

document.addEventListener('DOMContentLoaded', async () => {
  const contentContainer = document.querySelector('#content-container');
  const navLinks = document.querySelectorAll('nav ul li');

  // start with the academy page
  const startPage = "academy";
  const startLink = document.querySelector(`#${startPage}`);
  fetchHTML(startPage, contentContainer, removeActives(navLinks, startLink));


  navLinks.forEach(function(link) {
    link.addEventListener('click', async e => {
      e.preventDefault();
      if (link.classList.contains('active')) {
        return;
      }
      fetchHTML(link.id, contentContainer, removeActives(navLinks, link)) 
    });
  });
});


