var options = {
    maxGenerationLength : 25,   //seconds
    numberOfHorses : 25,
    startingPosition : {x: 500, y: 480},
    mutationRate : 0.02,
    horseSpeedThreshold : 1,    //min required speed
    timeBeforeDeath : 4 * 60,   //seconds * 60
    jointHolders : true,
    muscleColor : 'rgba(100,149,237,',  //yes, this way
    jointColor : 'rgba(255,99,71,',
    muscleOpacity : 0.5,
    jointOpacity : 0.5
}

// Matter.js module aliases
var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint,
    Events = Matter.Events,
    Bounds = Matter.Bounds,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices;

// synaptic.js module aliases
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

//create a matter.js engine
var engine = Engine.create(document.getElementById('WorldWrapper'),{
    render: {
        bounds: Bounds.create(  //this is viewport area
            [
                { x: 0, y: 0 },     //min
                { x: 1024, y: 500 } //max
            ]
        ),
        options: {
            width: 1024,        //this is physical canvas width
            height: 500,        //and height
            background: '#fafafa',
            wireframeBackground: '#222',
            hasBounds: true,
            enabled: true,
            wireframes: false,
            showSleeping: true,
            showDebug: false,
            showBroadphase: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: false,
            showAxes: false,
            showPositions: false,
            showAngleIndicator: false,
            showIds: false,
            showShadows: false
        }
    },
    timing: {
        timeScale: 1
    }
});

//world dimensions
engine.world.bounds = Bounds.create([
    { x: 0, y: 0 },     //min
    { x: 20000, y: 600 }//max
]);

//LOOPS region

Events.on( engine, "tick", function() {
    
    //new generation region
    
    if ( newGenerationCondition() ) {
        var previousGeneration = currentGeneration; 
        currentGeneration = new generation( previousGeneration.number + 1, previousGeneration.nextBrains() );
        delete previousGeneration;  
        this.timing.timestamp = 0;
        currentGeneration.start();
        
        document.getElementById('GenerationCounter').innerHTML = currentGeneration.number;
    }
    
    document.getElementById('TimeLeft').innerHTML = Math.round( options.maxGenerationLength - (this.timing.timestamp / 1000) ) + 's';
    
    //new generation endregion
    
    var horses = currentGeneration.horses;
    
    //camera position region
    
    var bounds = engine.render.bounds;
    
    //sets the center of the bounds at the farthest's horse position
    Bounds.shift( bounds, { x : findFarthestHorse(horses).position.x, y : 400 });
    Bounds.translate( bounds, Vector.neg( Vector.div( Vector.sub( bounds.max, bounds.min ), 2)) );
    //camera position endregion
    
    
    //a multi-purpose horses loop
    for ( i = 0; i < horses.length; i++) {
        
        for ( j = 0; j < horse.prototype.frontLegs + horse.prototype.rearLegs; j++) {
            horses[i].legsTouch[j] = 0;
        }
        
        //update horse's position and velocity
        if ( !horses[i].isDead ) {
            horses[i].position = horses[i].body.bodies[0].position;
            horses[i].velocity = horses[i].body.bodies[0].velocity;
        }
        
        // check if a horse should die now
        if ( !horses[i].isDead && horses[i].timeBeforeDeath <= 0 ) {
            Composite.removeComposite( engine.world, horses[i].body, true );
            horses[i].isDead = true;
        } 
        else if ( horses[i].velocity.x < options.horseSpeedThreshold ) {
            horses[i].timeBeforeDeath--;

            var opacity = 1 / options.timeBeforeDeath * horses[i].timeBeforeDeath ;

            var bodies = Composite.allBodies(horses[i].body);
            for ( var j = 0; j < bodies.length; j++ ) {
                bodies[j].render.fillStyle = 'rgba(200,200,200,' + opacity + ')';
                bodies[j].render.strokeStyle = 'rgba(100,100,100,' + opacity + ')';
            }

            var constraints = Composite.allConstraints(horses[i].body);
            for ( var j = 0; j < constraints.length; j++ ) {

                if ( constraints[j].label.search('muscle') != -1 ) {
                    constraints[j].render.strokeStyle = options.muscleColor + opacity * options.muscleOpacity + ')';
                }
                else if ( constraints[j].label == 'joint') {
                    constraints[j].render.strokeStyle = options.jointColor + opacity * options.jointOpacity + ')';
                }

            }
        }
        else {
            horses[i].timeBeforeDeath = options.timeBeforeDeath;
        } 
        
    }
    
    //legs' collisions tracking region
    var collisions = engine.pairs.collisionActive;
    for ( i = 0; i < collisions.length; i++ ) {
        var bodyA = collisions[i].bodyA;
        var bodyB = collisions[i].bodyB;
        
        if (
            ( bodyA.label == 'ground' && bodyB.label.search( 'leg-lower-' ) != -1 ) ||
            ( bodyB.label == 'ground' && bodyA.label.search( 'leg-lower-' ) != -1 ) 
        ) 
        {
            
            var leg;
            bodyA.label == 'ground' ? leg = bodyB : leg = bodyA;
            
            var temp = leg.label.replace( 'leg-lower-', '' );   // 'horseId-legNum'
            var vals = temp.split( '-' );                       // [horseId,legNum]
            
            var horseId = vals[0];
            var legNum = vals[1];

            for ( j = 0; j < horses.length; j++) {
                if ( horses[j].id = horseId ){
                    horses[j].legsTouch[ legNum ] = 1; 
                }
            }
            
        }
    }
    
    //legs' collisions tracking endregion
    
    for ( i = 0; i < horses.length; i++) {
        if ( !horses[i].isDead ) {
            horses[i].act( horses[i].think( horses[i].perceive() ) );
        }
    }
});

//LOOPS endregion

//FUNCTIONS region

//returns the COMPOSITE farthest from the (0,0) point
function findFarthestHorse( horses ) {
    var maxDistance = 0;
    var farthest;
    for (var i = 0; i < horses.length; i++){
        if ( !horses[i].isDead ){
            var currDistance = Composite.allBodies( horses[i].body )[0].position.x;
            if ( currDistance >= maxDistance ) {
                maxDistance = currDistance;
                farthest = horses[i];
            }
        }
    }
    if (farthest == undefined) {
        farthest = horses[0];
    }
    return farthest;
}

//returns a VECTOR specifying the center of giver BOUNDS
function center( bounds ) {
    return Vertices.centre([ bounds.min, bounds.max ]);
}

//returns the relative angle between the parts of the given CONSTRAINT
function relAngle( constraint ) {
    return constraint.bodyB.angle - constraint.bodyA.angle;
}

//checks whether or not a new GENERATION should start  
function newGenerationCondition() {
    
    var mainCondition = true;
    var horses = currentGeneration.horses;
    for ( var i = 0; i < horses.length; i++ ) {
        if ( !horses[i].isDead ) {
            mainCondition = false;
        }
    }
    if ( 
        mainCondition ||
        engine.timing.timestamp > 1000 * options.maxGenerationLength ||
        findFarthestHorse( currentGeneration.horses ).position.x >= engine.world.bounds.x -100
    ) 
    {
        return true;
    }
    return false;
    
}

//FUNCTIONS endregion

//GENERATION region

function generation( number, horseBrains ) {
    
    this.number = number;
    
    //create the horses with:
    //a) random brains
    if (!horseBrains){
        this.horses = [];
        this.horseBodies = [];
        for ( var i = 0; i < options.numberOfHorses; i++ ) {
            this.horses[i] = new horse( 250, 40, options.startingPosition );
            this.horseBodies[i] = this.horses[i].body;
        }
    }
    //b) given brains
    else {
        this.horses = [];
        this.horseBodies = [];
        for ( var i = 0; i < options.numberOfHorses; i++ ) {
            this.horses[i] = new horse( 250, 40, options.startingPosition, horseBrains[i] );
            this.horseBodies[i] = this.horses[i].body;
        }
    }

    //create a ground
    this.ground = Bodies.rectangle(

        engine.world.bounds.max.x/2,    //x 
        610,                            //y
        engine.world.bounds.max.x,      //width
        60,                             //height
        { 
            isStatic: true,
            label: 'ground'
        }
    
    );
}

generation.prototype = {
    
    //starts the generation
    start : function () {
        //load everything into the World
        World.clear( engine.world , false );
        var objects = [].concat( this.horseBodies, [this.ground] );

        World.add(engine.world, objects);
    },
    
    //returns a set of brains for HORSEs for a next generation
    //a genetic algorithm should be here
    nextBrains : function () {
        
        
        var result = [];
        var horses = this.horses;
        var brains = [];
        var fitnessSum = 0;
        
        for ( var i = 0; i < horses.length; i++ ) {
            
            //fitness function: length * speed = l * (l / t) = l^2 / t
            var length = horses[i].position.x - options.startingPosition.x;
            horses[i].fitness = Math.pow(length, 2) / engine.timing.timestamp
            fitnessSum += horses[i].fitness;
            
            brains.push( horses[i].brain );
            
        }
        
        //all elements in 'possibilities' array are in range: 0 <= x <= 1
        var possibilities = [];
        possibilities[0] = 1/fitnessSum * horses[0].fitness; 
        for ( var i = 1; i < horses.length; i++ ) {
            
        	possibilities[i] = (1/fitnessSum * horses[i].fitness) + possibilities[i-1];
            
        }
        console.log(possibilities);
        for ( var i = 0; i < horses.length; i++ ) {
        	
        	//choose two parents
        	var value = Math.random();
            
        	for ( var j = 0; j < horses.length; j++ ) {
        		
        		if ( value <= possibilities[j] ) {
        			var parentA = brains[j].toJSON();
                    //this is going to be the new brain
                    var child = brains[j].clone().toJSON();
        			break;
        		}
        		
        	}
        	value = Math.random();
        	for ( var j = 0; j < horses.length; j++ ) {
        		
        		if ( value <= possibilities[j] ) {
        			var parentB = brains[j].toJSON()
        			if (parentB == parentA) {
        				value = Math.random();
        				j = 0;
        			}
        			else {
        				break;
        			}
        		}
        		
        	}
        	//now we have two parents
            
            
        	for ( var j = 0; j < parentA.connections.length; j++ ) {
                
                if ( Math.random() < 0.5 ) {
                    child.connections[j].weight = parentB.connections[j].weigh;
                }
                
                if ( Math.random() < options.mutationRate ) {
                    child.connections[j].weight += Math.random() < 0.5 ? Math.random()/10 * -1 : Math.random()/10; 
                }
                
            }
            
            for ( var j = 0; j < parentA.neurons.length; j++ ) {
                
                if ( Math.random() < 0.5 ) {
                    child.neurons[j].bias = parentB.neurons[j].bias;
                }
                
                if ( Math.random() < options.mutationRate ) {
                    child.neurons[j].bias += Math.random() < 0.5 ? Math.random()/10 * -1 : Math.random()/10; 
                }
                
            }
            
            
        	result.push( Network.fromJSON(child) );
        }
        
        return result;
        
    }
}

//GENERATION endregion

//HORSE region

//make a horse
function horse( baseWidth, baseHeight, basePos, brain ){
    
    //time in which the horse will die if it goes slower than options.horseSpeedThreshold
    this.timeBeforeDeath = options.timeBeforeDeath;
    
    //obvious :)
    this.isDead = false;
    
    //legs as matter.js COMPOUNDS
    this.legs = [];
    
    //touch sensory info will be stored here and used in perceive method
    this.legsTouch = [];
    
    //muscles as matter.js CONSTRAINTS. Use their STIFFNESS property to contract
    this.muscles = [];
    
    //making the brain
    var limbs = horse.prototype.frontLegs + horse.prototype.rearLegs;
    var joints = limbs * 2;
    if (!brain) {
        this.brain = new Architect.Perceptron( joints + limbs + 1 , 8, joints );
    }
    else {
        this.brain = brain;
    }
    
    //set the brain's activation function (squash)
    var layers = [].concat(this.brain.layers.hidden, [this.brain.layers.input, this.brain.layers.output]);
    for ( var i = 0; i < layers.length; i++ ) {
        layers[i].set({
            squash : Neuron.squash.TANH
        });
    }

    //the main rectangle legs are attached to
    var base = Bodies.rectangle(
        basePos.x, 
        basePos.y, 
        baseWidth, 
        baseHeight,
        {   
            //default is 0.001
            density: 0.001   
        }
    );
    
    //making the body
    this.body = Composite.create({

        bodies: [ base ]

    });
    
    this.position = this.body.bodies[0].position;
    this.velocity = this.body.bodies[0].velocity;
    
    this.id = this.body.id;
    
    //making front legs
    this.legsFront = [];
    for ( var i = 0; i < horse.prototype.frontLegs; i++ ) {
        this.legsFront.push( this.leg( base, {x: baseWidth/2.2, y: 0} ) );
    }
    
    //making rear legs
    this.legsRear = [];
    for ( var i = 0; i < horse.prototype.rearLegs; i++ ) {
        this.legsRear.push( this.leg( base, {x: baseWidth/-2.2, y: 0} ) );
    }

    this.body.composites = this.legs;
    var bodies = Composite.allBodies(this.body);
    for ( var i = 0; i < bodies.length; i++ ) {
        bodies[i].groupId = 1;
    }
}

horse.prototype = {
    
    frontLegs : 2,
    rearLegs : 2,
    
    
    //max muscle STIFFNESS (-limit,limit)
    limit : 0.1,
    
    //make a leg
    leg : function leg( base, relPos ) {
        
        var upperWidth = 30;
        var upperHeight = 80;
        var lowerWidth = 20;
        var lowerHeight = 80;
        var holderStiffness = 0.1;
        var holderOffset = { x: 40, y: -10 };
        var holderRender = {
            lineWidth : 1,
            strokeStyle : 'rgba(200,200,200,0.5)'
        }
        
        var position = {x: base.position.x + relPos.x, y: base.position.y + relPos.y};
        var upper = Bodies.trapezoid(
            position.x, 
            position.y, 
            upperWidth, 
            upperHeight, 
            -0.1, 
            {
                label: 'leg-upper-' + this.body.id + '-' + this.legs.length
            }
        );
        
        var lower = Bodies.trapezoid(
            position.x, 
            position.y, 
            lowerWidth, 
            lowerHeight, 
            -0.5, 
            {
                chamfer:1,
                label: 'leg-lower-' + this.body.id + '-' + this.legs.length
            }
        ); 
                
        //hip muscle
        var muscleHip = Constraint.create({
            bodyA: base,
            bodyB: upper, 
            pointA: { x: relPos.x - upperHeight/2, y: 0 },
            pointB: { x: 0, y: upperHeight/4 + 10 },
            length: 0,
            stiffness: 0.001,
            label: 'muscle-hip-' + this.legs.length,
            render: {
                strokeStyle: options.muscleColor + options.muscleOpacity + ')'
            }
        });
        this.muscles.push(muscleHip);
        
        //knee muscle
        var muscleKnee = Constraint.create({
            bodyA: upper,
            bodyB: lower, 
            pointA: { x: 0, y: upperHeight/-2 },
            pointB: { x: lowerWidth/-2, y: lowerHeight/-2 },
            length: 0,
            stiffness: 0.001, 
            label: 'muscle-knee-' + this.legs.length,
            render: {
                strokeStyle: options.muscleColor + options.muscleOpacity + ')'
            }
        });
        this.muscles.push(muscleKnee);
        
        var hip = Constraint.create({ //hip
            bodyA: base,
            bodyB: upper, 
            pointA: { x: relPos.x, y: 0 },
            pointB: { x: 0, y: upperHeight/-2 },
            length: 1,
            stiffness: 0,
            label: 'joint',
            render: {
                strokeStyle: options.jointColor + options.jointOpacity + ')'
            }
        });
        
        var knee = Constraint.create({ //knee
            bodyA: upper,
            bodyB: lower, 
            pointA: { x: 0, y: upperHeight/2 - 10 },
            pointB: { x: 0, y: lowerHeight/-2 + 10 },
            length: 1,
            stiffness: 0, 
            label: 'joint',
            render: {
                strokeStyle: options.jointColor + options.jointOpacity + ')'
            }
        });

        var readyLeg = Composite.create({

            bodies: [ upper, lower ],
            constraints: [ 
                
                hip,
                knee,
                muscleHip,
                muscleKnee
                
            ],
            label: 'leg-' + this.body.id

        });
        
        if ( options.jointHolders ) {
           readyLeg.constraints = readyLeg.constraints.concat([
                
                //left hip holder
                Constraint.create({
                    bodyA: base,
                    bodyB: upper, 
                    pointA: Vector.sub( hip.pointA, {x: holderOffset.x, y: 0 }),
                    pointB: Vector.add( hip.pointB, {x: 0, y: holderOffset.y }),
                    length: Vector.magnitude(holderOffset),
                    stiffness: holderStiffness,
                    label: 'holder',
                    render : holderRender
                }),
                
                //right hip holder
                Constraint.create({
                    bodyA: base,
                    bodyB: upper, 
                    pointA: Vector.add( hip.pointA, {x: holderOffset.x, y: 0 }),
                    pointB: Vector.add( hip.pointB, {x: 0, y: holderOffset.y }),
                    length: Vector.magnitude(holderOffset),
                    stiffness: holderStiffness,
                    label: 'holder',
                    render : holderRender
                }),
                
                //left knee holder
                Constraint.create({
                    bodyA: upper,
                    bodyB: lower, 
                    pointA: Vector.sub( knee.pointA, {x: holderOffset.x, y: 0 }),
                    pointB: Vector.add( knee.pointB, {x: 0, y: holderOffset.y }),
                    length: Vector.magnitude(holderOffset),
                    stiffness: holderStiffness,
                    label: 'holder',
                    render : holderRender
                }),
                
                //right knee holder
                Constraint.create({
                    bodyA: upper,
                    bodyB: lower, 
                    pointA: Vector.add( knee.pointA, {x: holderOffset.x, y: 0 }),
                    pointB: Vector.add( knee.pointB, {x: 0, y: holderOffset.y }),
                    length: Vector.magnitude(holderOffset),
                    stiffness: holderStiffness,
                    label: 'holder',
                    render : holderRender
                })

            ]);
        }
        
        this.legs.push(readyLeg);
        return readyLeg;
    },
    
    //the following three methods should be used this way:
    //this.act( this.think( this.perceive() ) );
    
    //get the sensory info
    perceive : function() {
        
        // balance value (0 is steady)
        var balance = Composite.allBodies( this.body )[0].angle;
        
        var joints = [];
        var constraints = Composite.allConstraints( this.body );
        for ( var i = 0; i < constraints.length; i++ ) {
            if (constraints[i].label == 'joint') {
                joints.push( constraints[i] );
            }
        }
        
        // angles of joints
        var jointAngles = [];
        for ( var i = 0; i < joints.length; i++ ) {
            jointAngles[i] = relAngle( joints[i] );
        }
        
        // touch sensory info
        var touches = this.legsTouch;
        
        //final dataset
        var data = [].concat( [balance], jointAngles, touches );
        return data;
    },
    
    //process the sensory info
    think : function( data ) {
        return this.brain.activate( data );
    },
    
    //contract muscles using the given data ARRAY
    act : function( data ) {
        var log = [];
        for ( var i = 0; i < this.muscles.length; i++ ) {
            
            if (  data[i] > this.limit )            this.muscles[i].stiffness = this.limit;
            else if ( data[i] < this.limit * -1 )   this.muscles[i].stiffness = this.limit * -1; 
            else                                    this.muscles[i].stiffness = data[i];
            
            log.push( this.muscles[i].stiffness );
        }
        //console.log(log):
    }
    
}

 //HORSE endregion

//MAIN region

var currentGeneration = new generation(0);
currentGeneration.start();
Engine.run(engine);

//MAIN endregion