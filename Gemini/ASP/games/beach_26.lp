label(resource(r_1_XX_),effort,write).
label(entity(e_1_XX_),person).

entity(e_1_XX_).

resource(r_1_XX_).

many(entity(e_1_XX_)).

initialize(set_value(resource(r_1_XX_),scalar(0))).
initialize(fill(all,orange)).
initialize(set_draggable(entity(e_1_XX_),true)).
initialize(add(entity(e_1_XX_),scalar(1),location(middle,center))).
initialize(set_sprite(entity(e_1_XX_),triangle)).
initialize(set_color(entity(e_1_XX_),red)).

controlLogic(draggable(entity(e_1_XX_))).

timer_logic(timer(t_1_XX_),scalar(7),loop).

pool(entity(e_1_XX_),location(top,left),random,ordered).
pool(entity(e_1_XX_),location(top,center),random,ordered).
pool(entity(e_1_XX_),location(top,right),random,ordered).
pool(entity(e_1_XX_),location(middle,left),random,ordered).
pool(entity(e_1_XX_),location(middle,center),random,ordered).
pool(entity(e_1_XX_),location(middle,right),random,ordered).
pool(entity(e_1_XX_),location(bottom,left),random,ordered).
pool(entity(e_1_XX_),location(bottom,center),random,ordered).
pool(entity(e_1_XX_),location(bottom,right),random,ordered).

boundary(closed).

initialize(set_value(resource(r_1_XX_),scalar(0))).
initialize(set_value(resource(r_1_XX_),scalar(2))).

precondition(overlaps(entity(e_1_XX_),entity(e_1_XX_),true),outcome(o_1_XX_)).
result(outcome(o_1_XX_),increase(resource(r_1_XX_),scalar(1))).
result(outcome(o_1_XX_),clear(cursor)).
result(outcome(o_1_XX_),delete(entity(e_1_XX_))).

precondition(ge(resource(r_1_XX_),scalar(3)),outcome(o_2_XX_)).
precondition(le(amount(orange),scalar(9)),outcome(o_2_XX_)).
result(outcome(o_2_XX_),decrease_over_time(property(entity(e_1_XX_),health),scalar(10))).
result(outcome(o_2_XX_),increase_over_time(property(entity(e_1_XX_),health),scalar(10))).

precondition(timer_elapsed(t_1_XX_),outcome(o_3_XX_)).
result(outcome(o_3_XX_),add(entity(e_1_XX_),scalar(1),pool(entity(e_1_XX_)))).

precondition(tick,tick).
result(tick,apply_restitution(entity(e_1_XX_),entity(e_1_XX_))).

reading(bad,orange).
reading(produces,relation(pool(entity(e_1_XX_)),entity(e_1_XX_))).
reading(produces,relation(entity(e_1_XX_),resource(r_1_XX_))).
reading(good,outcome(o_1_XX_)).
reading(stakes(low),resource(r_1_XX_)).
reading(grinding,resource(r_1_XX_)).
==========
<p>Wait for people to filter in. Drag them together to coordinate efforts.</p>