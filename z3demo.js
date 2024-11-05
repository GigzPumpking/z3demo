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

console.log(`${bobVal} ${maryVal} ${cathyVal} ${sueVal}`);