export function handleAcademy() {
  const allDetails = document.querySelectorAll('.academy .timeline .details');
  const toggleOpen = document.getElementById('toggle-open');
  const toggleClose = document.getElementById('toggle-close');
  const lastItem = document.querySelector('.academy .timeline').lastElementChild;
  lastItem.classList.add('no-border');

  const timelineDots = document.querySelectorAll('.academy .dot');
  timelineDots.forEach(function(dot) {
    const target = dot.getAttribute('data-target');
    const targetElement = document.getElementById(target);

    dot.addEventListener('click', () => {
      targetElement.classList.toggle('show');
    });
  });
  
  toggleOpen.addEventListener('click', () => {
    allDetails.forEach(function(detail) {
      if (!detail.classList.contains('show')) {
        detail.classList.toggle('show');
      }
    });
  });

  toggleClose.addEventListener('click', () => {
    allDetails.forEach(function(detail) {
      if (detail.classList.contains('show')) {
        detail.classList.toggle('show');
      }
    });
  });
}
