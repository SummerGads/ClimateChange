
%%%%% SOUP OF THINGS TO PULL FROM %%%%%


physicsMetaphors(spring;pendulum).
agentTypes(chase;random;random_chase;flee;random_flee).
offensiveAgent(chase;random;random_chase).
defensiveAgent(random;flee; random_flee).


opposite(north,south).
opposite(east,west).
opposite(forward,backward).
opposite(left,right).
opposite(B,A) :- opposite(A,B).
direction(D)
  :- opposite(D, _).

vertical(north;south;forward;backward).
horizontal(east;west;left;right).
direction(north;south;east;west;forward;backward;left;right).
cardinal(north;south;east;west).
local(forward;backward;left;right).


buttons(mouse_button;space;up_arrow;down_arrow;left_arrow;right_arrow).
buttonOrder(mouse_button,up_arrow).
buttonOrder(space,up_arrow).
buttonOrder(up_arrow,down_arrow).
buttonOrder(down_arrow,left_arrow).
buttonOrder(left_arrow,right_arrow).
buttonOrder(A,C) :- buttonOrder(A,B), buttonOrder(B,C).
buttonStates(pressed;held;released).
controls(cursor). % OTHERS?
controls(BUTTON) :- buttons(BUTTON).

sprites(square;circle;upset_face;anxious_face;happy_face).
colors(red;green;blue;yellow;magenta;cyan;white;light_grey;dark_grey;black).

potentialEntities(e1;e2;e3;e4;e5).
entityOrdering(e1,e2).
entityOrdering(e2,e3).
entityOrdering(e3,e4).
entityOrdering(e4,e5).
entityOrdering(A,C) :- entityOrdering(A,B), entityOrdering(B,C).

potentialResources(r1;r2;r3;r4;r5).
potentialOutcomes(o1;o2;o3;o4;o5).
outcomeOrder(o1,o2).
outcomeOrder(o2,o3).
outcomeOrder(o3,o4).
outcomeOrder(o4,o5).
outcomeOrder(A,C) :- outcomeOrder(A,B), outcomeOrder(B,C).

constants(low;mid;high).
potentialValues(V) :- constants(V).

%potentialValues(R) :-  potentialResources(R).

potentialModes(playing;story_progression;game_loss;game_win).
polarity(true;false).


%end modes
end_mode(game_loss;game_win).

%ordering of values  
lower_than(low,mid).
lower_than(low,high).
lower_than(mid,high).



change(increases;decreases;set_to).

