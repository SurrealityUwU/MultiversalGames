import * as p5 from "p5";
import { collideRectRect } from "p5collide"; 
import playerSprite from "../assets/player/sprites/player1.png"

export default function sketch(p5){
    const Direction = {
        UP: "UP",
        DOWN: "DOWN",
    }

    var currentActionDict = {}
    var currentActionList = []
    
    const vector_up = new p5.constructor.Vector(0, 1)
    const vector_down = new p5.constructor.Vector(0, -1)
    const vector_up2 = new p5.constructor.Vector(0, 2)
    const vector_down2 = new p5.constructor.Vector(0, -2)

    const worldWidth = window.innerWidth;
    const worldHeight = window.innerHeight;

    class Agent {
        constructor(initialPosition, mapping, speed, width, height, color) {
            this.position = initialPosition;
            this.mapping = mapping;
            this.speed = speed;
            this.width = width;
            this.height = height;
            this.color = color;
        }
    
        update(actionList) {
            var deltaLocation = delta_from_action_and_mapping(actionList, this.mapping)
            deltaLocation.mult(this.speed)
            this.position.add(deltaLocation);
            for (var key in Direction) {
            currentActionDict[key] = false
            }
        }
        
        draw() {
            p5.fill(this.color)
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(p5.loadImage(playerSprite), 0, 0);
        }
        
        isOutOfCanvas() {
            if (this.position.x > worldWidth ||
            this.position.x < 0 ||
            this.position.y > worldHeight ||
            this.position.y < 0) {
            return true
            } else {
            return false
            }
        }
        
        isCollidingWithObstacle(obstacle) {
            return collideRectRect(this.position.x, this.position.y, 
                                    this.width, this.height, 
                                    obstacle.position.x, obstacle.position.y, 
                                    obstacle.width, obstacle.height);
        }
    }
      

    class Obstacle {
        constructor(initialPosition, intitialSpeed, width, height, color) {
            this.position = initialPosition;
            this.speed = intitialSpeed;
            this.width = width;
            this.height = height;
            this.color = color;
        }
        
        update() {
            this.position.add(this.speed);  
        }
        
        draw() {
            p5.fill(this.color)
            p5.rect(this.position.x, this.position.y, this.width, this.height)
        }
        
        isOutOfCanvas() {
            if (this.position.x > worldWidth ||
            this.position.x < 0 - this.width ||
            this.position.y > worldHeight ||
            this.position.y < 0) {
            return true
            } else {
            return false
            }
        }
    }

    const permutations = arr => {
        if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
        return arr.reduce(
            (acc, item, i) =>
            acc.concat(
            permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
                item,
                ...val,
            ])
            ),
            []
        );
    };
    
    var allMapping = []
    var hypotheses = []
    var obstacles = []
    
    const agentSpeed = 5
    const agentSize = 10
    
    const nObstacles = 10
    const obstacleSize = 20
    const obstacleMaxSpeed = 3.5
    console.log("GLOBAl")

    let img;
    p5.preload = () => {
    }
    
    p5.setup = () => {
        p5.createCanvas(worldWidth, worldHeight );
        p5.rectMode(p5.CORNER); // for collision library
        p5.ellipseMode(p5.CENTER); // for collision library
        
        img = p5.loadImage('player1.png')
        
        p5.image(img, 0, 0, 100, 100);
      
        for (var key in Direction) {
          currentActionDict[key] = false
        }

        allMapping = permutations([vector_up, vector_down])
        allMapping.push(...permutations([vector_up2, vector_down2]))
      
        allMapping.forEach(function(mapping, index) {
          var agent = new Agent(p5.createVector(worldWidth/8, worldHeight/2), mapping, agentSpeed, agentSize, agentSize, agentColor())
          hypotheses.push(agent)
        });
        
        for (const x of Array(nObstacles).keys()) {
          var initialPosition = p5.createVector((worldWidth-obstacleSize), (worldHeight-obstacleSize)*Math.random())
          var initialSpeed = p5.createVector(obstacleMaxSpeed*(Math.random() * -0.5  - 0.5) , 0)
          var obstacle = new Obstacle(initialPosition, initialSpeed, obstacleSize, obstacleSize, p5.color('black'))
          obstacles.push(obstacle)
        }
        p5.frameRate(30);
    }

    function newObstacle() {
        var initialPosition = p5.createVector((worldWidth-obstacleSize), (worldHeight-obstacleSize)*Math.random())
        var initialSpeed = p5.createVector(obstacleMaxSpeed*(Math.random() * -0.5  - 0.5) , 0)
        var obstacle = new Obstacle(initialPosition, initialSpeed, obstacleSize, obstacleSize, p5.color('black'))
        obstacles.push(obstacle)
    }

    p5.draw = () => {
        p5.background(225);
  
        currentActionList = Object.values(currentActionDict)
      
        obstacles.forEach(function(obstacle, index) {
            obstacle.update()
            obstacle.draw()
        });
      
        hypotheses.forEach(function(hyp, index) {
          hyp.update(currentActionList)
        });
      
        hypotheses = hypotheses.filter(hyp => !hyp.isOutOfCanvas())
      
        obstacles.forEach(function(obs, index) {});
        obstacles = obstacles.filter(obs => !obs.isOutOfCanvas());
      
        if (obstacles.length < nObstacles) {
          newObstacle();
        }
      
        obstacles.forEach(function(obstacle, index) {
          hypotheses = hypotheses.filter(hyp => !hyp.isCollidingWithObstacle(obstacle))
        });
      
        hypotheses.forEach(function(hyp, index) {
          hyp.draw()
        });
    }
    
    function randomColor() {
        return p5.color(p5.random(255), p5.random(255), p5.random(255), p5.random(200, 255));
    }

    function agentColor() {
        return p5.color(255, 0, 0, 255);
    }

    function randomGridLocation() {
        return p5.createVector(p5.floor(p5.random(p5.nCol)), p5.floor(p5.random(p5.nRow)));
    }

    function gridToCanvas(gridLocation) {
        return gridLocation.copy().mult(p5.cellSize)
    }

    function delta_from_action_and_mapping(actionList, mapping) {
        var delta_pos = p5.createVector(0, 0);
        for (const [index, isPressed] of currentActionList.entries()) {
            if (isPressed) {
                delta_pos.add(mapping[index])
            }
        }
        return delta_pos
    }

    p5.mouseWheel = (event) => {
        if (event.delta > 0) {
            currentActionDict[Direction.UP] = true
        } else if (event.delta < 0) {
            currentActionDict[Direction.DOWN] = true
        }
    }
}