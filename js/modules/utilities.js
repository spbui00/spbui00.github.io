export function removeActives(elements, link) {
  elements.forEach(function (element) {
    element.classList.remove('active');
  });

  if (link) {
    link.classList.add('active');
  }
}

export async function fetchHTML(page, container, callback) {
  try {
    const response = await fetch(`../../components/${page}.html`);
    if (response.ok) {
      const html = await response.text();
      container.innerHTML = html;
      import(`../${page}.js`).then(module => {
        module[`handle${page.charAt(0).toUpperCase() + page.slice(1)}`]();
      });
      if (callback) callback();
    } else {
      throw new Error('Network response was not ok.');
    }
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}
