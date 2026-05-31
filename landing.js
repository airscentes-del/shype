const menuButton = document.getElementById('menuButton');
const landingMenu = document.getElementById('landingMenu');

if (menuButton && landingMenu) {
  menuButton.addEventListener('click', () => {
    const open = landingMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  landingMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      landingMenu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}
