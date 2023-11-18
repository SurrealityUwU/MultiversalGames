import * as p5 from "p5";
import { collideRectRect } from "p5collide"; 


export default function sketch(p5){
    const Direction = {
        DOWN: "DOWN",
        UP: "UP",
    }


    var currentActionDict = {}
    var currentActionList = []
    
    const vector_up = new p5.constructor.Vector(0, 1)
    const vector_down = new p5.constructor.Vector(0, -1)
    const vector_up2 = new p5.constructor.Vector(0, 2)
    const vector_down2 = new p5.constructor.Vector(0, -2)

    const worldWidth = window.innerWidth;
    const worldHeight = window.innerHeight;

    const showHitBoxes = true   ;

    const constPath = "http://127.0.0.1:3001/src/scroller_game/src/assets"
    let playerSprite = p5.loadImage(constPath + "/player/sprites/player1.png")
    let obstacleSprite = p5.loadImage(constPath + "/asteroids/asteroid.png")
    let projectileSprite = p5.loadImage(constPath + "/shoot/shoot1.png")

    class Agent {
        constructor(initialPosition, mapping, speed, width, height, color, agentShootInterval, agentProjectileSpeed) {
            this.position = initialPosition;
            this.mapping = mapping;
            this.speed = speed;
            this.width = width;
            this.height = height - 25;
            this.color = color;
            this.agentShootInterval = agentShootInterval;
            this.agentProjectileSpeed = agentProjectileSpeed;
            this.hasShot = false;
            this.lastShot = 0; 
            this.projectileWidth = 38
            this.projectileHeight = 12
            this.healthHeight = 7
            this.healthYOffset = 15
            this.healthWidth = this.width
        }
    
        update(actionList) {

            // if (this.isCollidingWithWall()) {
                // console.log(actionList)
                // currentActionDict[this.isCollidingWithWall()] = false;
                // actionList = Object.values(currentActionDict)
                // actionList[0] = false;  
            // }
            var deltaLocation = delta_from_action_and_mapping(actionList, this.mapping)
            deltaLocation.mult(this.speed)  
            console.log(deltaLocation)
            if (this.position.y + deltaLocation["y"] < 0) {
                this.position.y = 0
            } else if (this.position.y + this.height + deltaLocation["y"] > worldHeight) {
                this.position.y = worldHeight - this.height
            } else {
                this.position.add(deltaLocation);
            }
            for (var key in Direction) {
                currentActionDict[key] = false
            }
        }
        
        draw() {
            if (showHitBoxes) {
                p5.fill(this.color)
            } 
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(playerSprite, this.position.x, this.position.y-10, this.width, this.height + 25);
            
            p5.fill(p5.color("green"))
            p5.rect(this.position.x, this.position.y - this.healthYOffset, this.healthWidth, this.healthHeight)
            p5.noFill()
            if(!this.hasShot) {
                this.shoot();
                this.hasShot = true;
                this.lastShot = p5.millis();
            }
            else {
                if(p5.millis() - this.lastShot > this.agentShootInterval) {
                    this.hasShot = false;
                }
            }
        }

        shoot() {
            newProjectile(p5.createVector(this.position.x, this.position.y+this.height/2-this.projectileHeight/2), this.agentProjectileSpeed, this.projectileWidth, this.projectileHeight)
        }

        takeDamage(dmg) {
            this.healthWidth -= dmg;
        }
        
        isDead() {
            return this.healthWidth <= 0 ? true : false
        }

        isCollidingWithWall() {
            if (this.position.y <= 0) {
                this.position.y = 0
                return Direction.UP;
            } else if (this.position.y + this.height >= worldHeight) {
                this.position.y = worldHeight - this.height
                return Direction.DOWN
            }
            return false;
        }
        
        isCollidingWithObstacle(obstacle) {
            return collideRectRect(this.position.x, this.position.y, 
                                    this.width, this.height, 
                                    obstacle.position.x, obstacle.position.y, 
                                    obstacle.width, obstacle.height);
        }
    }

    class Projectile {
        constructor(initialPosition, speed, width, height) {
            this.position = initialPosition;
            this.speed = speed;
            this.width = width;
            this.height = height;
        }

        update() {
            this.position.add(this.speed);  
        }

        draw() {
            if (showHitBoxes) {
                p5.fill(p5.color(255, 0, 0, 255))
            }
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(projectileSprite, this.position.x, this.position.y, this.width, this.height);
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
            if (showHitBoxes) {
                p5.fill(this.color)
            }
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(obstacleSprite, this.position.x, this.position.y, this.width, this.height);
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
    var projectiles= []
    
    const agentSpeed = 10
    const agentWidth = 80
    const agentHeight = 63
    const agentShootInterval = 500 //ms
    const agentProjectileSpeed = 10
    const backgroundColor = p5.color(205);
    
    const nObstacles = 10
    const obstaclSizeMin = 10
    const obstacleSizeMax = 30
    const obstacleSpeedMin = 2
    const obstacleSpeedMax = 4

    p5.updateWithProps = props => {
    };

    p5.setup = () => {
        p5.createCanvas(worldWidth, worldHeight );
        p5.rectMode(p5.CORNER); // for collision library    
        p5.ellipseMode(p5.CENTER); // for collision library

        if (!showHitBoxes) {
            p5.noStroke();
            p5.noFill();
        }
      
        for (var key in Direction) {
          currentActionDict[key] = false
        }

        allMapping = permutations([vector_up, vector_down])
        allMapping.push(...permutations([vector_up2, vector_down2]))
      
        allMapping.forEach(function(mapping, index) {
          var agent = new Agent(p5.createVector(worldWidth/8, worldHeight/2), mapping, agentSpeed, agentWidth, agentHeight, agentColor(), agentShootInterval, agentProjectileSpeed)
          hypotheses.push(agent)
        });
        

        for (const x of Array(nObstacles).keys()) {
            newObstacle();
        }
        p5.frameRate(30);
    }

    function newObstacle() {
        let obstacleSize =  Math.random() * obstacleSizeMax + obstaclSizeMin;
        let obstacleSpeed =  Math.random() * obstacleSpeedMax + obstacleSpeedMin;
        var initialPosition = p5.createVector((worldWidth-obstacleSize), (worldHeight-obstacleSize)*Math.random())
        var initialSpeed = p5.createVector(obstacleSpeed*(Math.random() * -0.5  - 0.5) , 0)
        var obstacle = new Obstacle(initialPosition, initialSpeed, obstacleSize, obstacleSize, p5.color('black'))
        obstacles.push(obstacle)
    } 
    
    function newProjectile(position, speed, width, height) {
        var projectile = new Projectile(position, speed, width, height)
        projectiles.push(projectile)
    }

    p5.draw = () => {
        p5.background(backgroundColor);
  
        currentActionList = Object.values(currentActionDict)
        obstacles.forEach(function(obstacle) {
            obstacle.update()
            obstacle.draw()
        });

        hypotheses.forEach(function(hyp) {
            hyp.update(currentActionList)
        });

        projectiles.forEach(function(proj) {
            proj.update()
            proj.draw()
        });
      
        hypotheses = hypotheses.filter(hyp => !hyp.isDead())
      
        obstacles = obstacles.filter(obs => !obs.isOutOfCanvas());
      
        if (obstacles.length < nObstacles) {
            newObstacle();
        }

        obstacles.forEach(function(obstacle, index) {
            var hitHypo = hypotheses.filter(hyp => hyp.isCollidingWithObstacle(obstacle));
            hitHypo.forEach((hyp,) => {hyp.takeDamage(20)});
            if (hitHypo.length > 0) {
                obstacles.splice(index, 1);
            }
        });
      
        hypotheses.forEach(function(hyp) {
            hyp.draw()
            // hyp.isCollidingWithWall()
        });


    }   

    function agentColor() {
        return p5.color(255, 0, 0, 255);
    }

    function delta_from_action_and_mapping(actionList, mapping) {
        var delta_pos = p5.createVector(0, 0);
        for (const [index, isPressed] of actionList.entries()) {
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