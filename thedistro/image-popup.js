document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.gallery-img');


  const popup = document.createElement('div');
  popup.className = 'popup-container'; 
  document.body.appendChild(popup);

  
  const popupImage = document.createElement('img');
  popup.appendChild(popupImage);


  images.forEach((img) => {
      img.addEventListener('click', () => {
          popupImage.src = img.src;
          popup.classList.add('show');
      });
  });

  popup.addEventListener('click', (e) => {
      if (e.target === popup) {
          popup.classList.remove('show');
      }
  });
});