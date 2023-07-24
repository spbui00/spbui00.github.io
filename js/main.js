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

  const nav = document.querySelector('.brand');
  nav.addEventListener('click', () => {
    ul.classList.toggle('show');
  });
  
  // for safari weirdness
  const main = document.querySelector('main');
  setElementHeight(main);
  window.addEventListener('resize', setElementHeight(main));
});

function setElementHeight(el) {
  // 90vh
  const vh = window.innerHeight * 0.01;
  el.style.setProperty('--vh', `${vh}px`);
}

