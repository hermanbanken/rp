import Mouse exposing (..)
import Automaton exposing (..)
import Signal exposing (map2, map, foldp)
import Graphics.Element exposing (Element, show)

type alias Pair = (Int,Int)
type alias Dist = Int

combinedInputs = map2 (,) Mouse.isDown Mouse.position

dist : Pair -> Pair -> Dist
dist (x1,y1) (x2,y2) =
  let
    dx = toFloat x1 - toFloat x2
    dy = toFloat y1 - toFloat y2
  in 
    round (sqrt (dx * dx + dy * dy))

-- skip first step if supplied -1 for d
measureStep : Pair -> (Dist, Pair) -> (Dist, (Dist, Pair))
measureStep next (d, previous) = 
  let
    sum = (if d < 0 then 0 else d + dist previous next)
  in
    (sum, (sum, next))

measure : Pair -> Automaton Pair Dist
measure initialPos = hiddenState (-1, initialPos) measureStep

ignore : Automaton Pair Dist
ignore = pure (\_ -> 0)

hoMeasure : Automaton (Bool, Pair) Dist
hoMeasure =
  let
    f : (Bool, Pair) 
      -> (Bool, Automaton Pair Dist) 
      -> (Dist, (Bool, Automaton Pair Dist))
    f (down, pos) (pDown, a) =
      if down == pDown then
        (snd (step pos a), (down, fst (step pos a)))
      else if down then
        (0, (down, measure pos))
      else
        (0, (down, ignore))
  in
    hiddenState (False, ignore) f

main = map (\output -> show output) (run hoMeasure 0 combinedInputs)