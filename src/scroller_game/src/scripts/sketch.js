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

    const showHitBoxes = true;

    const constPath = "http://127.0.0.1:3001/src/scroller_game/src/assets"
    let background = p5.loadImage(constPath + "/background/bg-preview-big.png")
    let playerSpriteStraight = p5.loadImage(constPath + "/player/sprites/player1.png")
    let playerSpriteUp = p5.loadImage(constPath + "/player/sprites/player3.png")
    let playerSpriteDown = p5.loadImage(constPath + "/player/sprites/player2.png")
    let obstacleSprite = p5.loadImage(constPath + "/asteroids/asteroid.png")
    let projectileSprite = p5.loadImage(constPath + "/shoot/shoot1.png")
    let projectileSprite2 = p5.loadImage(constPath + "/shoot/shoot2.png")
    let boss1Path = constPath + "/boss1/boss" 
    let boss1MaxIndex = 2;



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
            this.playerSprite = playerSpriteStraight;
            this.vel = 3;
            this.actionDict = {}
        }
    
        update(actionList) {
            for (var key in currentActionDict) {
                this.actionDict[key] = currentActionDict[key];
                currentActionDict[key] = 0
            }
            var deltaLocation = delta_from_action_and_mapping(actionList, this.mapping)
            // deltaLocation.mult(this.speed)    
            // console.log(deltaLocation)
            
            var moveAmount = Math.abs(deltaLocation["y"]/4);
            if (deltaLocation["y"] > moveAmount) {
                deltaLocation["y"] = moveAmount;
            } else if (deltaLocation["y"] < -moveAmount) {
                deltaLocation["y"] = -moveAmount;
            } else {
                moveAmount = deltaLocation["y"];
            } 

            // console.log(deltaLocation )

            if (this.position.y + deltaLocation["y"] < 0) {
                this.position.y = 0
            } else if (this.position.y + this.height + deltaLocation["y"] > worldHeight) {
                this.position.y = worldHeight - this.height
            } else {
                this.position.add(deltaLocation);
            } 

            if (deltaLocation["y"] < 0) {
                this.playerSprite = playerSpriteUp;
            } else if (deltaLocation["y"] > 0) { 
                this.playerSprite = playerSpriteDown
            } else {
                this.playerSprite = playerSpriteStraight
            }

            // console.log(currentActionDict)
            for (var key in Direction) {
                if (this.actionDict[key] > 0 && this.actionDict[key] >= moveAmount) {
                    this.actionDict[key] -= moveAmount
                } else {
                    this.actionDict[key] = 0
                }
                // currentActionDict[key] = 0
            }
        }
        
        draw() {
            if (showHitBoxes) {
                p5.fill(this.color)
            } 
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(this.playerSprite, this.position.x, this.position.y-10, this.width, this.height + 25);
            
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
        isCollidingWithObstacle(obstacle) {
            return collideRectRect(this.position.x, this.position.y, 
                                    this.width, this.height, 
                                    obstacle.position.x, obstacle.position.y, 
                                    obstacle.width, obstacle.height);
        }
    }
      

    class Obstacle {
        constructor(initialPosition, intitialSpeed, width, height, sprite) {
            this.position = initialPosition;
            this.speed = intitialSpeed;
            this.width = width;
            this.height = height;
            this.sprite = sprite
        }

        update() {
            this.position.add(this.speed);  
        }
        
        draw() {
            if (showHitBoxes) {
                p5.fill(p5.color("red"))
            }
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            if (this.sprite) {
                p5.image(this.sprite, this.position.x, this.position.y, this.width, this.height);
            }
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

    class AnimatedSprite {
        constructor(position, width, height, interval) {
            this.position = position;
            this.animation = [];
            this.interval = interval;
            this.index = 0;
            this.bool = false;
            this.last = 0;
            this.width = width;
            this.height = height;

            this.healthWidth = 1300;
            this.healthHeight = 20;
            this.healthPos = p5.createVector(worldWidth / 2 - this.healthWidth / 2, worldHeight / 15 - this.healthHeight / 2)
 
            this.attacks = []
            this.attackWarningCount = 0;
            this.attackWarningInterval = 1000;
            this.bool = false;
            
            this.lastWarning = 3000;
        }

        addAnimation(path, maxIndex) {
            for (let i = 1; i <= maxIndex; i++) {
                let sprite = p5.loadImage(path + i + ".png")
                this.animation.push(sprite)
            }
        }

        showHealthBar() {
            p5.fill(p5.color("red"))
            p5.rect(this.healthPos.x, this.healthPos.y, this.healthWidth, this.healthHeight)
            p5.noFill()
        }
        
        takeDamage(dmg) {
            this.healthWidth -= dmg;
        }
        
        isDead() {
            return this.healthWidth <= 0 ? true : false
        }

        update() {
            this.attacks.forEach((atk) => {
                atk.draw();
                atk.update();
            })
        }
        
        attackWarning() {
            if(p5.millis() > this.lastWarning && p5.millis() < this.lastWarning +  500 && this.attackWarningCount < 3) {
                console.log(this.attackWarningCount)
                p5.fill(p5.color(255, 0, 0, 100)) 
                p5.rect(this.position.x + this.width / 2, this.position.y + this.height / 2 - 50, -worldWidth, 100)
                p5.noFill()
            }
            else { 
                if(p5.millis() - this.lastWarning > this.attackWarningInterval) {
                    this.lastWarning = p5.millis();
                    this.attackWarningCount += 1;
                } 
            } 

            // p5.fill(p5.color(255, 0, 0, 100)) 
            // p5.rect(this.position.x + this.width / 2, this.position.y + this.height / 2 - 50, -worldWidth, 100)

        }

        attack() {
            var o = new Obstacle(p5.createVector(this.position.x + this.width / 2, this.position.y + this.height / 2 - 50), -50, worldWidth, 100, projectileSprite2 )
            this.attacks.push(o); 
        }

    
        draw() { 
            this.showHealthBar();
            
            this.attackWarning();
            
            if(p5.millis() > 6000 && !this.once) {
                this.attack();
                this.once = true; 
            }
            
            if(!this.bool) {
                this.bool = true;
                this.index += 1;
                this.last = p5.millis();
            }
            else {
                if(p5.millis() - this.last > 500) {
                    this.bool = false;
                }
            }
            let index = Math.floor(this.index) % this.animation.length;

            if (showHitBoxes) {
                p5.fill(p5.color("red"))
            }
            p5.rect(this.position.x, this.position.y, this.width, this.height)
            p5.image(this.animation[index], this.position.x, this.position.y, this.width, this.height);
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
    const agentDamage = 10
    const backgroundColor = p5.color(205);
    
    const nObstacles = 15
    const obstaclSizeMin = 15
    const obstacleSizeMax = 40
    const obstacleSpeedMin = 5
    const obstacleSpeedMax = 8 

    var boss1;

    const bossWidth = 700
    const bossHeight = 700
    const bossAnimationInterval = 500 //ms


    p5.updateWithProps = props => {
    };

    p5.preload = () => {
        boss1 = new AnimatedSprite(p5.createVector(worldWidth - bossWidth * 2 / 3, worldHeight / 2 - bossHeight / 2), bossWidth, bossHeight, bossAnimationInterval);
        boss1.addAnimation(boss1Path, boss1MaxIndex)
    }

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
        var obstacle = new Obstacle(initialPosition, initialSpeed, obstacleSize, obstacleSize, obstacleSprite)
        obstacles.push(obstacle)
    } 
    
    function newProjectile(position, speed, width, height) {
        var projectile = new Projectile(position, speed, width, height)
        projectiles.push(projectile)
    }

    p5.draw = () => {
        p5.background(background);

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
        
        var hitBoss = projectiles.filter(proj => proj.isCollidingWithObstacle(boss1))
        hitBoss.forEach(() => {boss1.takeDamage(agentDamage )})
        projectiles = projectiles.filter(proj => !proj.isCollidingWithObstacle(boss1));

        if (!boss1.isDead()) {
            boss1.update();
            boss1.draw(); 
        }
        hypotheses = hypotheses.filter(hyp => !hyp.isDead())
        obstacles = obstacles.filter(obs => !obs.isOutOfCanvas());
      
        if (obstacles.length < nObstacles) {
            newObstacle();  
        }

        boss1.attacks.forEach((atk) => {
            var hitHypo = hypotheses.filter(hyp => hyp.isCollidingWithObstacle(atk));
            hitHypo.forEach(hyp => {hyp.takeDamage(5)}); 
        })

        obstacles.forEach(function(obstacle, index) {
            var hitHypo = hypotheses.filter(hyp => hyp.isCollidingWithObstacle(obstacle));
            hitHypo.forEach((hyp,) => {hyp.takeDamage(20)});
            if (hitHypo.length > 0) {
                obstacles.splice(index, 1); 
            }
        });
      
        hypotheses.forEach(function(hyp) {
            hyp.draw()
        });
    }   

    function agentColor() {
        return p5.color(255, 0, 0, 255);
    }

    function delta_from_action_and_mapping(actionList, mapping) {
        var delta_pos = p5.createVector(0, 0);
        for (const [index, val] of actionList.entries()) {
            if (val) {
                var temp = p5.createVector(0, 0);
                temp.add(mapping[index])
                temp.mult(val)
                delta_pos.add(temp)
            }
        }
        return delta_pos
    }

    p5.mouseWheel = (event) => {
        if (event.delta > 0) {
            currentActionDict[Direction.UP] += agentSpeed
            currentActionDict[Direction.DOWN] = 0
        } else if (event.delta < 0) {
            currentActionDict[Direction.UP] = 0
            currentActionDict[Direction.DOWN] += agentSpeed
        }
    }
}