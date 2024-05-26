function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


  



  var items = document.querySelectorAll(".item");

  items.forEach(function(item) {
    item.addEventListener("click", function() {
      // Volta todas as opções para a posição inicial
      items.forEach(function(otherItem) {
        otherItem.classList.remove("active");
        otherItem.style.transform = "translateX(0px)";
      });
  
      // Ativa a opção clicada e a move para a posição desejada
      this.classList.add("active");
      this.style.transform = "translateX(20px)";
    });
  
    // Adiciona animação ao passar o mouse
    item.addEventListener("mouseover", function() {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(10px)"; // Movendo 10 pixels para a direita ao passar o mouse
      }
    });
  
    item.addEventListener("mouseout", function() {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(0px)"; // Voltando à posição original ao retirar o mouse
      }
    });
  });
  


// Outros scripts e funções aqui

// document.querySelectorAll('.dropdown-item').forEach(item => {
//   item.addEventListener('click', event => {
//       document.getElementById('nomeproduto').value = event.target.getAttribute('data-item');
//       document.getElementById('dropdownMenuButton1').innerText = event.target.innerText;
//   });
// });



document.getElementById("botaoMenu").addEventListener("click", function() {
  var logo = document.querySelector(".logo");
  if (logo.classList.contains("moved")) {
      // Movendo para a direita, removendo a classe "moved"
      logo.style.marginLeft = "130px";
      logo.classList.remove("moved");
  } else {
      // Movendo para a esquerda, adicionando a classe "moved"
      var currentMargin = window.getComputedStyle(logo).marginLeft;
      var newMargin = (parseInt(currentMargin) || 0) - 30 + "px";
      logo.style.marginLeft = newMargin;
      logo.classList.add("moved");
  }
});






