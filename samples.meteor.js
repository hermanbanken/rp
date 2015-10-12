//// signal-compose ////

<template name="HUD">
  <div>Celcius: {{tempC}}</div>
  <div>Fahrenheit: {{tempF}}</div>
</template>

Template.HUD.tempF = Temperature;
Template.HUD.tempC = function(){
  return Temperature() * 1.8 + 32;
}

////////////////////////