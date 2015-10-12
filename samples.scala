//// signal-compose ////

val tempC = Signal{ Temperature() }
val tempF = Signal{ tempC() * 1.8 + 32}
observe(tempC) { C => /* print on label */ }
observe(tempF) { F => /* print on label */ }

////////////////////////