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
                { x: 1024, y: 768 } //max
            ]
        ),
        options: {
            width: 1024,        //this is physical canvas width
            height: 768,        //and height
            background: '#fafafa',
            wireframeBackground: '#222',
            hasBounds: true,
            enabled: true,
            wireframes: true,
            showSleeping: true,
            showDebug: true,
            showBroadphase: false,
            showBounds: false,
            showVelocity: true,
            showCollisions: true,
            showAxes: false,
            showPositions: false,
            showAngleIndicator: false,
            showIds: true,
            showShadows: false
        }
    },
    timing: {
        timeScale: 1
    }
});

engine.world.bounds = Bounds.create([   //this is world dimensions
    { x: 0, y: 0 },     //min
    { x: 10000, y: 600 } //max
]);

//LOOPS region

Events.on( engine, "tick", function() {
    var bounds = engine.render.bounds;
    
    //sets the center of the bounds at the farthest's horse position
    Bounds.shift( bounds, findFarthestHorse(horses).body.bodies[0].position );
    Bounds.translate( bounds, Vector.neg( Vector.div( Vector.sub( bounds.max, bounds.min ), 2)) );
    
    //console.log(horses[0].body.bodies[0].angle);
    
    //legs' collisions tracking region
    for ( i = 0; i < horses.length; i++) {
        for ( j = 0; j < horse.prototype.frontLegs + horse.prototype.rearLegs; j++) {
            horses[i].legsTouch[j] = 0;
        }
    }
    var collisions = engine.pairs.collisionActive;
    for ( i = 0; i < collisions.length; i++ ) {
        var bodyA = collisions[i].bodyA;
        var bodyB = collisions[i].bodyB;
        
        if (
            ( bodyA.label == 'ground' && bodyB.label.search( 'leg-lower-' ) !=-1 ) ||
            ( bodyB.label == 'ground' && bodyA.label.search( 'leg-lower-' ) !=-1 ) 
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
    //console.log(horses[0].legsTouch);
    
    for ( i = 0; i < horses.length; i++) {
        console.log(horses[i].perceive());
        //horses[i].think( horses[i].perceive() );
    }
    
});

/*Events.on( engine, "collisionStart", function(pairs) {
    console.log(pairs);
});*/

//LOOPS endregion
//FUNCTIONS region

//returns the COMPOSITE farthest from the (0,0) point
function findFarthestHorse( horses ) {
    var maxDistance = 0;
    var farthest;
    for (var i = 0; i < horses.length; i++){
        var currDistance = Composite.allBodies( horses[i].body )[0].position.x;
        if (currDistance >= maxDistance) {
            maxDistance = currDistance;
            farthest = horses[i];
        }
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

//FUNCTIONS endregion
//HORSE region

//make a horse
function horse( baseWidth, baseHeight, basePos ){
    
    //making the brain
    var limbs = horse.prototype.frontLegs + horse.prototype.rearLegs;
    var joints = limbs * 2;
    this.brain = new Architect.Perceptron( joints + limbs + 1 , 8, joints );

    //the main rectangle legs are attached to
    var base = Bodies.rectangle(
        basePos.x, 
        basePos.y, 
        baseWidth, 
        baseHeight
    );
    
    //making the body
    this.body = Composite.create({

        bodies: [ base ],

    });
    
    this.id = this.body.id;
    console.log(this.id);
    
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
    
    //legs as matter.js COMPOUNDS
    legs: [],
    
    //touch sensory info will be stored here and used in perceive method
    legsTouch : [],
    
    //make a leg
    leg: function leg( body, relPos ) {
        var position = {x: body.position.x + relPos.x, y: body.position.y + relPos.y};
        var trapA = Bodies.trapezoid(
            position.x, 
            position.y, 
            30, 
            80, 
            -0.1, 
            {
                label: 'leg-upper-' + this.body.id + '-' + this.legs.length
            }
        );
        var trapB = Bodies.trapezoid(
            position.x, 
            position.y, 
            20, 
            80, 
            -0.5, 
            {
                chamfer:1,
                label: 'leg-lower-' + this.body.id + '-' + this.legs.length
            }
        ); 
        
        var readyLeg = Composite.create({

            bodies: [ trapA, trapB ],
            constraints: [ 

                Constraint.create({ //knee
                    bodyA: trapA,
                    bodyB: trapB, 
                    pointA: { x: 0, y: 35 },
                    pointB: { x: 0, y: -35 },
                    length: 1,
                    stiffness: 1, 
                    label: 'joint'
                }),

                Constraint.create({ //hip
                    bodyA: body,
                    bodyB: trapA, 
                    pointA: { x: relPos.x, y: 0 },
                    pointB: { x: 0, y: -35 },
                    length: 1,
                    stiffness: 1,
                    label: 'joint'
                })

            ],
            label: 'leg-' + this.body.id

        });
        
        this.legs.push(readyLeg);
        return readyLeg;
    },
    
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
    }
    
}

//HORSE endregion
//MAIN region

//create the horses
var horses = [];
var horseBodies = [];
for ( var i = 0; i < 1; i++ ) {
    horses[i] = new horse( 250, 40, {x: 300 + 100*i, y: 410 - 50*i} );
    horseBodies[i] = horses[i].body;
}

//create a ground
var ground = Bodies.rectangle(
    
    engine.world.bounds.max.x/2,    //x 
    610,                            //y
    engine.world.bounds.max.x,      //width
    60,                             //height
    { 
        isStatic: true,
        label: 'ground'
    }
    
);

console.log(horses);
console.log(horseBodies);

//load everything into the World
var objects = [].concat( horseBodies, [ground] );

World.add(engine.world, objects);

//start the simulation
Engine.run(engine);
console.log(engine);

//MAIN endregion