import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");
const solver = new Solver();

// There are 4 pets, a dog, a cat, a bird, and a fish, where cat is 1, dog is 2, bird is 3, and fish is 4

// There are 4 kids, Bob, Mary, Cathy, and Sue

// Each kid has a pet, and no two kids have the same pet

let Bob = Int.const('Bob');

let Mary = Int.const('Mary');

let Cathy = Int.const('Cathy');

let Sue = Int.const('Sue');

// Each kid has a different pet

solver.add(Distinct(Bob, Mary, Cathy, Sue));

// Each pet is assigned to a kid

solver.add(Or(Bob.eq(1), Mary.eq(1), Cathy.eq(1), Sue.eq(1)));

solver.add(Or(Bob.eq(2), Mary.eq(2), Cathy.eq(2), Sue.eq(2)));

solver.add(Or(Bob.eq(3), Mary.eq(3), Cathy.eq(3), Sue.eq(3)));

solver.add(Or(Bob.eq(4), Mary.eq(4), Cathy.eq(4), Sue.eq(4)));

// Bob has a dog

solver.add(Bob.eq(2));

// Sue has a bird

solver.add(Sue.eq(3));

// Mary does not have a fish

solver.add(Mary.neq(4));

// Run Z3 solver, find solution and sat/unsat
console.log(await solver.check());

// Extract value for Bob, Mary, Cathy, and Sue
const model = solver.model();
const bobVal = model.eval(Bob);
const maryVal = model.eval(Mary);
const cathyVal = model.eval(Cathy);
const sueVal = model.eval(Sue);

// Log pet values

console.log("Pet Scenario: " + `${bobVal} ${maryVal} ${cathyVal} ${sueVal}`);

// clear solver
solver.reset();

// New scenario: fenced in area

// Left fence is at tile x = 5

// Right fence is at tile x = 10

// Top fence is at tile y = 15

// Bottom fence is at tile y = 25

// Generate an item inside the fenced area

let x = Int.const('x');

let y = Int.const('y');

// x is between 5 and 10

solver.add(x.gt(5));

solver.add(x.lt(10));

// y is between 15 and 25

solver.add(y.gt(15));

solver.add(y.lt(25));

// Run Z3 solver, find solution and sat/unsat

console.log(await solver.check());

// Extract value for x and y

const model2 = solver.model();

const xVal = model2.eval(x);

const yVal = model2.eval(y);

// Log x and y values

console.log("Item inside of fence: " + `${xVal} ${yVal}`);

// clear solver

solver.reset();

// New scenario: generate an item on the top side of the fence or left side of the fence

// if left side, 
// x should be 5 and y should be between 15 and 25 (not 25 because it could be considered bottom side), 
// if top side, 
// y should be 15 and x should be between 5 and 10 (not 10 because it could be considered right side)

solver.add(Or(And(x.eq(5), y.ge(15), y.lt(25)), And(y.eq(15), x.ge(5), x.lt(10))));

// Run Z3 solver, find solution and sat/unsat

console.log(await solver.check());

// Extract value for x and y

const model3 = solver.model();

const xVal2 = model3.eval(x);

const yVal2 = model3.eval(y);

// Log x and y values

console.log("Item on top or left side of fence: " + `${xVal2} ${yVal2}`);

// clear solver

solver.reset();

// New scenario: generate an item outside of the fenced area

// x should be greater than 8 and y should be greater than 20

// x can technically be less than 10 as long as y is greater than 25, and y can be less than 25 as long as x is greater than 10

solver.add(x.ge(8));

solver.add(y.ge(20));

solver.add(Or(And(x.lt(10), y.gt(25)), And(x.gt(10), y.lt(25))));

// Run Z3 solver, find solution and sat/unsat

console.log(await solver.check());

// Extract value for x and y

const model4 = solver.model();

const xVal3 = model4.eval(x);

const yVal3 = model4.eval(y);

// Log x and y values

console.log("Item outside of fence and x >= 8 and y >= 20: " + `${xVal3} ${yVal3}`);
