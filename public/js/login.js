document.querySelector("form").addEventListener("submit",function(e){

e.preventDefault();

const email=document.querySelector('input[type="email"]').value;

const password=document.querySelector('input[type="password"]').value;

if(email=="" || password==""){

alert("Veuillez remplir tous les champs.");

return;

}

alert("Connexion réussie.");

window.location.href="index.html";

});