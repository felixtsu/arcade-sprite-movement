//% advanced=true color=190 weight=100 icon="\u21ac" block="Sprite Movement"
namespace sprite_movement{

    interface MovingSprite {
        sprite:Sprite
        velocity:number
    }

    let _managingSprites :MovingSprite[] = []

    function velocityOf(sprite:Sprite) :number{
        return Math.sqrt(Math.pow(sprite.vx, 2) + Math.pow(sprite.vy, 2))
    }

    //%block="make %sprite=variables_get(mySprite) randomly move with velocity %velocity"
    //%velocity.defl=50
    export function randomlyMoveSprite(sprite:Sprite, velocity:number) {
        sprite.vx = velocity
        let newSprite = true;
        for (let movingSprite of _managingSprites) {
            if (sprite == movingSprite.sprite) {
                movingSprite.velocity = velocity
                newSprite = false;
                break
            }
        }

        if (newSprite) {
            _managingSprites.push({sprite:sprite, velocity:velocity})
            sprite.onDestroyed(function() {
                for (let i = 0; i < _managingSprites.length;i++) {
                    if (_managingSprites[i].sprite == sprite) {
                        _managingSprites.removeAt(i)
                        break;
                    }
                }
            })
        }
    } 

    function oppositeOf(direction:CollisionDirection) :CollisionDirection{
        if (direction == CollisionDirection.Top) {
            return CollisionDirection.Bottom
        } else if (direction == CollisionDirection.Bottom) {
            return CollisionDirection.Top
        } else if (direction == CollisionDirection.Left) {
            return CollisionDirection.Right
        } else {
            return CollisionDirection.Left
        } 
    }
    
    function movingDirectionOf(sprite:Sprite) :CollisionDirection {
        if (sprite.vx > 0) {
            return CollisionDirection.Right
        } else if (sprite.vx < 0) {
            return CollisionDirection.Left
        } else if (sprite.vy > 0) {
            return CollisionDirection.Bottom
        } else {
            return CollisionDirection.Top
        }  
    }
    function turnSprite(movingSprite:MovingSprite, direction:CollisionDirection) {
        let sprite = movingSprite.sprite
        let v = movingSprite.velocity

        if (direction == CollisionDirection.Top) {
            sprite.vx = 0
            sprite.vy = -v
        } else if (direction == CollisionDirection.Bottom) {
            sprite.vx = 0
            sprite.vy = v
        } else if (direction == CollisionDirection.Left) {
            sprite.vx = -v
            sprite.vy = 0
        } else {
            sprite.vx = v
            sprite.vy = 0
        } 
    }

    function alignToTileCenter(sprite:Sprite) {
        let loc = tiles.locationOfSprite(sprite)    
        sprite.x = loc.x
        sprite.y = loc.y
    }

    const FOUR_DIRECTION  = [CollisionDirection.Top, CollisionDirection.Right, 
    CollisionDirection.Bottom, CollisionDirection.Left]

    game.onUpdate(function() {
        for (let movingSprite of _managingSprites) {
            let sprite = movingSprite.sprite
            let loc = tiles.locationOfSprite(sprite)

            let candidateList : CollisionDirection[] = []
            for (let direction of FOUR_DIRECTION) {
                if (!sprite.isHittingTile(direction)) {
                    candidateList.push(direction)
                }
            }

            // only turn when
            let deltaX = loc.x - sprite.x
            let deltaY = loc.y - sprite.y

            // 60Hz
            let interval = (deltaX + deltaY) / (sprite.vx + sprite.vy)

            let removedCandidate = []

            if (candidateList.length != 4 || (interval > 0 && interval < 0.016)) {
                // velocity is zero after hitting a wall, unable to detect using interval
                // hit wall or close enough to tile center
                let moving = velocityOf(sprite) != 0
                let movingDirection = movingDirectionOf(sprite)

                for (let direction of candidateList) {
                    if (moving && (direction == oppositeOf(movingDirection))) {
                        // no sudden u-turn at crossing unless hit wall
                        removedCandidate.push(direction)
                    } 
                    if (tiles.tileIsWall(tiles.locationInDirection(loc, direction))) {
                        removedCandidate.push(direction)
                    }
                }

                for (let needToRemoveDirection of removedCandidate) {
                    candidateList.removeElement(needToRemoveDirection)
                }
                
                alignToTileCenter(sprite)
                turnSprite(movingSprite, Math.pickRandom(candidateList))
                
            }
        }
    })  

}