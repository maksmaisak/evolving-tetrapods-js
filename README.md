# evolving-tetrapods-js

### [Demo][demo link]

It is a simulation of simple environments populated by [intelligent agents] which use [artificial neural networks] to make decisions. The general idea is as follows.

Each agent contains a simple neural network (a [multilayer perceptron]) which is, essentially, a function which takes and returns a set of numbers. The input of the NN is the data from various "sensors", represented by numbers. The outputs are used to determine the actions of the agent. 

The agents' behavior in the environment is simulated in short "rounds". At the end of each round the "fitness" of each agent is evaluated. The fittest agents' data (their "genome") gets crossed over and, with a low probability, mutated to produce a new population for the next round.

---

The agents are 2D, four-legged creatures on a flat surface. Each "horse" consists of a number of different shapes which are connected with inextensible "joints" and extensible "muscles". Each muscle can contract or expand, causing movement of the connected parts. The fitness of the horses depends solely on the distance along the surface they manage to traverse over the course of a single round. The intended effect was to have horses' brains evolve over many generations to learn to walk or gallop. 

Each update, the neural network of each horse is provided with data regarding the rotation of the body in general, the relative angles of each joint and whether or not the legs touch the ground. The outputs of the NN define the stiffness values for each muscle, causing them to extend or contract. 

The project was written in JavaScript. I used [Matter.js] for physics simulation. [Synaptic.js] was used to create the neural networks to act as the horses' brains. An online demonstration is available [here][demo link]. 

[intelligent agents]: https://en.wikipedia.org/wiki/Intelligent_agent
[artificial neural networks]: https://en.wikipedia.org/wiki/Artificial_neural_network
[multilayer perceptron]: https://en.wikipedia.org/wiki/Multilayer_perceptron

[Matter.js]: http://brm.io/matter-js/
[Synaptic.js]: http://caza.la/synaptic/
[demo link]: http://fazan64.github.io/evolving-tetrapods-js/