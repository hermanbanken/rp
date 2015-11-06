//// signal-compose ////

val tempC = Signal{ Temperature() }
val tempF = Signal{ tempC() * 1.8 + 32 }
val diff  = Signal{ tempC() - tempF() }

observe(tempC) { C => /* print on label */ }
observe(tempF) { F => /* print on label */ }
observe(diff)  { d => /* print on label */ }

////////////////////////