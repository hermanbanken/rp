//// signal-compose ////

Template.HUD.tempC = Temperature;
Template.HUD.tempF = () => Temperature() * 1.8 + 32;
Template.HUD.diff = () => Template.HUD.tempC() - Template.HUD.tempF();

<template name="HUD">
  <div>Celcius: {{tempC}}</div>
  <div>Fahrenheit: {{tempF}}</div>
  <div>Difference: {{diff}}</div>
</template>

////////////////////////

//// deps ////

var favoritePie = "apple";
var favoritePieDep = new Tracker.Dependency;

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

var handle = Tracker.autorun(function () {
  console.log("Your favorite Pie is " + getFavoritePie());
});
// "Your favorite Pie is apple"

setFavoritePie("chocolate");
// "Your favorite Pie is chocolate"

////////////////////////