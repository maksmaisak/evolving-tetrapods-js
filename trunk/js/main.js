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
            wireframes: false,
            showSleeping: true,
            showDebug: true,
            showBroadphase: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: true,
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
    { x: 20000, y: 600 } //max
]);

//LOOPS region

Events.on( engine, "tick", function() {
    var bounds = engine.render.bounds;
    
    //sets the center of the bounds at the farthest's horse position
    Bounds.shift( bounds, findFarthestHorse(horses).body.bodies[0].position );
    Bounds.translate( bounds, Vector.neg( Vector.div( Vector.sub( bounds.max, bounds.min ), 2)) );
    
    
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
    
    for ( i = 0; i < horses.length; i++) {
        horses[i].act( horses[i].think( horses[i].perceive() ) );
    }
});

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

//FUNCTIONS endregion

//HORSE region

//make a horse
function horse( baseWidth, baseHeight, basePos ){
    
    //legs as matter.js COMPOUNDS
    this.legs = [];
    
    //touch sensory info will be stored here and used in perceive method
    this.legsTouch = [];
    
    //muscles as matter.js CONSTRAINTS. Use their STIFFNESS property to contract
    this.muscles = [];
    
    //making the brain
    var limbs = horse.prototype.frontLegs + horse.prototype.rearLegs;
    var joints = limbs * 2;
    this.brain = new Architect.Perceptron( joints + limbs + 1 , 8, joints );
    
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

        bodies: [ base ],

    });
    
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
    limit : 0.05,
    
    //make a leg
    leg : function leg( base, relPos ) {
        
        var upperWidth = 30;
        var upperHeight = 80;
        var lowerWidth = 20;
        var lowerHeight = 80;
        var holderStiffness = 0.1;
        var holderOffset = { x: 40, y: -10 };
        
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
            pointA: { x: relPos.x - upperWidth/2, y: 0 },
            pointB: { x: upperWidth/-2, y: 0 },
            length: 0,
            stiffness: 0.001,
            label: 'muscle-hip-' + this.legs.length,
            render: {
                strokeStyle: 'cornflowerblue'
            }
        });
        this.muscles.push(muscleHip);
        
        //knee muscle
        var muscleKnee = Constraint.create({
            bodyA: upper,
            bodyB: lower, 
            pointA: { x: upperWidth/-2, y: 0 },
            pointB: { x: lowerWidth/-2, y: 0 },
            length: 0,
            stiffness: 0.001, 
            label: 'muscle-knee-' + this.legs.length,
            render: {
                strokeStyle: 'cornflowerblue'
            }
        });
        this.muscles.push(muscleKnee);
        
        var hip = Constraint.create({ //hip
            bodyA: base,
            bodyB: upper, 
            pointA: { x: relPos.x, y: 0 },
            pointB: { x: 0, y: upperHeight/-2 + 5 },
            length: 1,
            stiffness: 0,
            label: 'joint',
            render: {
                strokeStyle: 'tomato'
            }
        });
        
        var knee = Constraint.create({ //knee
            bodyA: upper,
            bodyB: lower, 
            pointA: { x: 0, y: upperHeight/2 - 5 },
            pointB: { x: 0, y: lowerHeight/-2 + 5 },
            length: 1,
            stiffness: 0, 
            label: 'joint',
            render: {
                strokeStyle: 'tomato'
            }
        });

        var readyLeg = Composite.create({

            bodies: [ upper, lower ],
            constraints: [ 

                hip,
                knee,
                muscleHip,
                muscleKnee,
                
                //left hip holder
                Constraint.create({
                    bodyA: base,
                    bodyB: upper, 
                    pointA: Vector.sub( hip.pointA, {x: holderOffset.x, y: 0 }),
                    pointB: Vector.add( hip.pointB, {x: 0, y: holderOffset.y }),
                    length: Vector.magnitude(holderOffset),
                    stiffness: holderStiffness,
                    label: 'holder',
                    render: {
                        lineWidth: 1,
                        strokeStyle: 'white'
                    }
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
                    render: {
                        lineWidth: 1,
                        strokeStyle: 'white'
                    }
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
                    render: {
                        lineWidth: 1,
                        strokeStyle: 'white'
                    }
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
                    render: {
                        lineWidth: 1,
                        strokeStyle: 'white'
                    }
                })

            ],
            label: 'leg-' + this.body.id

        });
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
        console.log(joints);
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
            console.log( this.muscles );
            if (  data[i] > this.limit )            this.muscles[i].stiffness = this.limit;
            else if ( data[i] < this.limit * -1 )   this.muscles[i].stiffness = this.limit * -1; 
            else                                    this.muscles[i].stiffness = data[i];
            
            log.push( this.muscles[i].stiffness );
        }
        //console.log(log);
    }
    
}

//HORSE endregion

//MAIN region

//create the horses
var horses = [];
var horseBodies = [];
for ( var i = 0; i < 10; i++ ) {
    horses[i] = new horse( 250, 40, {x: 500 + 0*i, y: 480} );
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
console.log(horses[0].brain);

//load everything into the World
var objects = [].concat( horseBodies, [ground] );

World.add(engine.world, objects);

//start the simulation
Engine.run(engine);

//MAIN endregion