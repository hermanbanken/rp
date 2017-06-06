import Html exposing (Html, text, div)
import Mouse exposing (..)

dist : (Int, Int) -> (Int, Int) -> Int
dist (x1,y1) (x2,y2) =
  let
    dx = toFloat x1 - toFloat x2
    dy = toFloat y1 - toFloat y2
  in 
    round (sqrt (dx * dx + dy * dy))

main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

-- MODEL

type alias Model = {
  x: Int
  , y : Int
  , d : Int
  , track : Bool
}

initialModel: Model
initialModel =
  { x = 0
  , y = 0
  , d = 0
  , track = False
  }

init : (Model, Cmd Msg)
init =
  (initialModel, Cmd.none)

-- UPDATE

type Msg
  = Position Int Int
  | Up Int Int
  | Down  Int Int

update: Msg -> Model -> (Model, Cmd a)
update msg model =
  case msg of
    Position x y ->
      let
        d = if model.track then model.d + dist (model.x, model.y) (x, y) else model.d
      in
        ({model | x = x, y = y, d = d} , Cmd.none)
    Up x y ->
      ({model | x = x, y = y, track = False} , Cmd.none)
    Down x y ->
      ({model | x = x, y = y, track = True, d = 0} , Cmd.none)

-- SUBSCRIPTIONS

subscriptions: Model -> Sub Msg
subscriptions model =
  Sub.batch
  [ Mouse.moves (\{x, y} -> Position x y)
  , Mouse.ups (\{x, y} -> Up x y)
  , Mouse.downs (\{x, y} -> Down x y)
  ]

-- VIEW

view: Model -> Html a
view model =
  Html.text (toString model.d)