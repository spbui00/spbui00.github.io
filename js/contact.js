import { createElement } from "./modules/utilities.js";

export function handleContact() {
  const form = document.querySelector('form');
  const formInner = form.innerHTML;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const endpoint = 'https://formspree.io/f/xqkvadlj';

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          form.innerHTML = `<p>You message has been sent! I will get in touch with you soon.</p>`;
          const submitAgainButton = createElement('button');
          submitAgainButton.innerHTML = 'Submit another message';
          submitAgainButton.addEventListener('click', () => {
            form.innerHTML = ``;
            form.innerHTML = formInner;
          });
          form.appendChild(submitAgainButton);
        } else {
          form.innerHTML = `<p>Oops! There was a problem submitting your form.</p>`;
          const submitAgainButton = createElement('button');
          submitAgainButton.innerHTML = 'Try again';
          submitAgainButton.addEventListener('click', () => {
            form.innerHTML = ``;
            form.innerHTML = formInner;
          });
        }
      })
      .catch(error => {
        console.error(error);
        form.innerHTML = `<p>Oops! There was a problem submitting your form.</p>`;
        const submitAgainButton = createElement('button');
        submitAgainButton.innerHTML = 'Try again';
        submitAgainButton.addEventListener('click', () => {
          form.innerHTML = ``;
          form.innerHTML = formInner;
        });
      });
  });

  
}
