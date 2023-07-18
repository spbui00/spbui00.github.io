export function handleWork() {
  const projectsContainer = document.querySelector('#projects .items');

  fetch('../assets/data/projects.json')
    .then((response) => response.json())
    .then((data) => {
      const projects = data.projects;

      // TODO: add sorting and filtering

      projects.forEach((project) => {
        const projectItem = document.createElement('div');
        projectItem.classList.add('item-project');
        const itemName = document.createElement('div');
        itemName.classList.add('item-name');

        if (projects.icon) {
          const itemIcon = document.createElement('div');
          itemIcon.classList.add('item-icon');
          fetch(`../assets/icons/${project.icon}.svg`)
            .then((response) => response.text())
            .then((svg) => {
              itemIcon.innerHTML = svg;
              itemName.appendChild(itemIcon);
            })
            .catch((error) => {
              console.error(error);
            });
        }
        
        itemName.innerHTML += project.name;
        projectItem.appendChild(itemName);

        const itemDescription = document.createElement('div'); 
        itemDescription.classList.add('item-description');
        itemDescription.innerHTML = project.description;
        projectItem.appendChild(itemDescription);

        
      });
    });
}
