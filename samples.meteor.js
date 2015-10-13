//// signal-compose ////

Template.HUD.tempF = Temperature;
Template.HUD.tempC = () => Temperature() * 1.8 + 32;

<template name="HUD">
  <div>Celcius: {{tempC}}</div>
  <div>Fahrenheit: {{tempF}}</div>
</template>

////////////////////////

//// deps ////

var favoritePie = "apple";
var favoritePieDep = new Deps.Dependency;

var getFavoritePie = function () {
  favoritePieDep.depend();
  return favoritePie;
};

var setFavoritePie = function (newValue) {
  favoritePie = newValue;
  favoritePieDep.changed();
};

getFavoritePie();
// "apple"

var handle = Deps.autorun(function () {
  console.log("Your favorite Pie is " + getFavoritePie());
});
// "Your favorite Pie is apple"

setFavoritePie("chocolate");
// "Your favorite Pie is chocolate"

////////////////////////