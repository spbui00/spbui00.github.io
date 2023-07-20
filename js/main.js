import { removeActives, fetchHTML } from './modules/utilities.js';

document.addEventListener('DOMContentLoaded', async () => {
  const contentContainer = document.querySelector('#content-container');
  const navLinks = document.querySelectorAll('nav ul li');
  const ul = document.querySelector('nav ul');

  // page that is loaded by default
  const startPage = "work";
  const startLink = document.querySelector(`#${startPage}`);
  fetchHTML(startPage, contentContainer, removeActives(navLinks, startLink));


  navLinks.forEach(function(link) {
    if (link.classList.contains('deactivated')) {
      return;
    };
    link.addEventListener('click', async e => {
      e.preventDefault();
      if (link.classList.contains('active')) {
        return;
      }
      fetchHTML(link.id, contentContainer, removeActives(navLinks, link))
      if (ul.classList.contains('show')) {
        ul.classList.toggle('show');
      }
    });
  });

  // if screen is phone size, close nav when link is clicked
  const nav = document.querySelector('.brand');
  console.log(nav);
  nav.addEventListener('click', () => {
    ul.classList.toggle('show');
  });
});


